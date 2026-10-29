from django.db import transaction
from django.db.models.signals import post_delete, pre_save

from .images import variant_names


def _delete_after_commit(file):
    # Avec l'original partent ses versions allégées (common.images) ; absentes, rien n'est fait.
    storage, names = file.storage, [file.name, *variant_names(file.name)]
    transaction.on_commit(lambda: [storage.delete(name) for name in names])


def cleanup_files(model, *field_names):
    """
    Supprime du disque les fichiers d'un modèle quand l'objet est supprimé
    ou quand une image est remplacée, pour ne pas accumuler de fichiers orphelins.
    """

    def on_delete(sender, instance, **kwargs):
        for name in field_names:
            file = getattr(instance, name)
            if file:
                _delete_after_commit(file)

    def on_save(sender, instance, **kwargs):
        if instance.pk is None:
            return
        old = sender._default_manager.filter(pk=instance.pk).only(*field_names).first()
        if old is None:
            return
        for name in field_names:
            old_file, new_file = getattr(old, name), getattr(instance, name)
            if old_file and old_file.name != new_file.name:
                _delete_after_commit(old_file)

    uid = f"cleanup_files_{model._meta.label_lower}"
    post_delete.connect(on_delete, sender=model, weak=False, dispatch_uid=f"{uid}_delete")
    pre_save.connect(on_save, sender=model, weak=False, dispatch_uid=f"{uid}_save")
