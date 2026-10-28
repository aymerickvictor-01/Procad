from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """12 éléments par page ; `?page_size=` permet d'en demander moins ou plus (50 max)."""

    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50
