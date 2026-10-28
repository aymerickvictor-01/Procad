from django.utils.text import slugify


def unique_slugify(instance, value, field_name="slug"):
    """
    Slug unique dérivé de `value`, avec suffixe numérique en cas de doublon :
    « maintenance », « maintenance-2 », « maintenance-3 »...
    """
    max_length = instance._meta.get_field(field_name).max_length
    base = slugify(value)[:max_length].strip("-") or "element"
    others = type(instance)._default_manager.exclude(pk=instance.pk)

    slug, n = base, 2
    while others.filter(**{field_name: slug}).exists():
        suffix = f"-{n}"
        slug = f"{base[: max_length - len(suffix)].rstrip('-')}{suffix}"
        n += 1
    return slug
