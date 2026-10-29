"""
E-mails envoyés à chaque nouvelle demande :
- alerte à l'équipe (settings.NOTIFY_EMAILS), avec les pièces jointes et un lien WhatsApp vers le client ;
- accusé de réception au visiteur, s'il a laissé son e-mail.

L'envoi a lieu après l'enregistrement en base et, par défaut, en arrière-plan : une panne du
serveur d'e-mails ne fait jamais échouer la demande, elle reste visible dans l'administration.
"""
import logging
import re
import threading
from html import escape

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone

from company.models import CompanyProfile

from .models import ContactMessage

logger = logging.getLogger(__name__)


def whatsapp_link(phone):
    """Lien WhatsApp vers un numéro ; un mobile camerounais saisi sans indicatif reçoit le 237."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 9 and digits.startswith("6"):
        digits = f"237{digits}"
    return f"https://wa.me/{digits}" if len(digits) >= 8 else ""


def _rows(message):
    """Lignes (libellé, valeur) du récapitulatif, sans les champs vides."""
    quote = message.kind == ContactMessage.Kind.QUOTE
    rows = [
        ("Référence", message.reference),
        ("Reçue le", timezone.localtime(message.created_at).strftime("%d/%m/%Y à %H:%M")),
        ("Nom", message.full_name),
        ("Téléphone", message.phone),
        ("E-mail", message.email),
        ("Service", message.service.title if message.service else ""),
    ]
    if quote:
        rows += [
            ("Type de projet", message.get_project_type_display()),
            ("Ville / quartier", message.city),
            ("Délai souhaité", message.get_timeline_display()),
            ("Budget indicatif", message.budget),
        ]
    else:
        rows.append(("Objet", message.subject))
    return [(label, value) for label, value in rows if value]


def _html(title, intro, rows, message_text, links, footer):
    table = "".join(
        f'<tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">{escape(label)}</td>'
        f'<td style="padding:6px 0;color:#111827;font-weight:600">{escape(str(value))}</td></tr>'
        for label, value in rows
    )
    buttons = "".join(
        f'<a href="{escape(url)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;'
        f'border-radius:8px;background:{color};color:#ffffff;text-decoration:none;font-weight:600">{escape(label)}</a>'
        for label, url, color in links
    )
    return f"""<!doctype html>
<html lang="fr"><body style="margin:0;background:#f3f5fa;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a1240;color:#ffffff;padding:20px 24px;border-radius:12px 12px 0 0">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9aa3cf">PROCAD</div>
    <div style="font-size:20px;font-weight:700;margin-top:4px">{escape(title)}</div>
  </div>
  <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0">
    <p style="margin:0 0 16px;color:#374151;line-height:1.6">{escape(intro)}</p>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px">{table}</table>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;color:#1f2937;line-height:1.6;white-space:pre-line;font-size:14px">{escape(message_text)}</div>
    <div style="margin-top:20px">{buttons}</div>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.5">{escape(footer)}</p>
  </div>
</div></body></html>"""


def _team_email(message, company):
    quote = message.kind == ContactMessage.Kind.QUOTE
    topic = message.service.title if message.service else message.subject
    title = f"Nouvelle demande de devis {message.reference}" if quote else f"Nouveau message {message.reference}"
    subject = f"[{company.name}] {'Devis' if quote else 'Message'} {message.reference} — {topic}"
    admin_url = f"{settings.SITE_URL}/admin/messages?message={message.id}"
    attachments = list(message.attachments.all())

    links = [("Ouvrir dans l'administration", admin_url, "#1530e0")]
    if whatsapp_link(message.phone):
        links.append(("Répondre sur WhatsApp", whatsapp_link(message.phone), "#128c4a"))
    if message.email:
        links.append(("Répondre par e-mail", f"mailto:{message.email}?subject=Re: {message.reference}", "#0a1240"))

    rows = _rows(message)
    note = f"{len(attachments)} pièce(s) jointe(s) à cet e-mail." if attachments else "Aucune pièce jointe."
    intro = "Une demande de devis vient d'arriver depuis le site." if quote else "Un message vient d'arriver depuis le site."
    text = "\n".join(
        [intro, ""]
        + [f"{label} : {value}" for label, value in rows]
        + ["", "Message :", message.message, "", note, "", *[f"{label} : {url}" for label, url, _ in links]]
    )

    email = EmailMultiAlternatives(
        subject=subject,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=settings.NOTIFY_EMAILS,
        reply_to=[message.email] if message.email else None,
    )
    email.attach_alternative(_html(title, intro, rows, message.message, links, note), "text/html")
    for attachment in attachments:
        with attachment.file.open("rb") as file:
            email.attach(attachment.original_name, file.read(), attachment.content_type)
    return email


def _client_email(message, company):
    quote = message.kind == ContactMessage.Kind.QUOTE
    what = "votre demande de devis" if quote else "votre message"
    title = "Demande bien reçue" if quote else "Message bien reçu"
    sentence = (
        f"Nous avons bien reçu {what}. Notre équipe l'étudie et revient vers vous dans les meilleurs délais. "
        "Rappelez la référence ci-dessous si vous nous contactez à ce sujet."
    )
    intro = f"Bonjour {message.full_name}, n{sentence[1:]}"
    contact = [value for value in (company.phone, company.email) if value]
    footer = f"{company.name}" + (f" — {' — '.join(contact)}" if contact else "") + ". Ceci est un message automatique."
    links = []
    if whatsapp_link(company.whatsapp):
        links.append(("Nous écrire sur WhatsApp", f"{whatsapp_link(company.whatsapp)}?text=Référence {message.reference}", "#128c4a"))

    rows = [(label, value) for label, value in _rows(message) if label not in ("Nom", "E-mail", "Reçue le")]
    text = "\n".join(
        [f"Bonjour {message.full_name},", "", sentence, ""]
        + [f"{label} : {value}" for label, value in rows]
        + ["", "Votre message :", message.message, "", f"L'équipe {company.name}"]
    )
    email = EmailMultiAlternatives(
        subject=f"{title} — {company.name} (réf. {message.reference})",
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[message.email],
        reply_to=settings.NOTIFY_EMAILS[:1] or None,
    )
    email.attach_alternative(_html(title, intro, rows, message.message, links, footer), "text/html")
    return email


def _send(emails):
    try:
        with get_connection(fail_silently=False) as connection:
            connection.send_messages(emails)
    except Exception:
        logger.exception("Échec de l'envoi des e-mails de notification")


def notify_new_message(message):
    """Prépare les e-mails (dans le fil de la requête) puis les envoie, en arrière-plan par défaut."""
    company = CompanyProfile.load()
    emails = []
    try:
        if settings.NOTIFY_EMAILS:
            emails.append(_team_email(message, company))
        if message.email:
            emails.append(_client_email(message, company))
    except Exception:
        logger.exception("Préparation des e-mails impossible pour %s", message.reference)
        return
    if not emails:
        return
    if settings.EMAIL_ASYNC:
        threading.Thread(target=_send, args=(emails,), daemon=True).start()
    else:
        _send(emails)
