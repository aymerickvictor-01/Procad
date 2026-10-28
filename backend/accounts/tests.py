from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient, APITestCase

User = get_user_model()
PASSWORD = "Procad-Test-2026!"


class AuthApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user("admin", "admin@procad.com", PASSWORD, is_staff=True)
        cls.visitor = User.objects.create_user("visiteur", "v@example.com", PASSWORD)
        cls.inactive = User.objects.create_user("ancien", "a@example.com", PASSWORD, is_staff=True, is_active=False)

    def setUp(self):
        cache.clear()

    def login(self, username="admin", password=PASSWORD, client=None):
        client = client or self.client
        return client.post("/api/auth/login/", {"username": username, "password": password}, format="json")

    # --- CSRF -------------------------------------------------------------

    def test_csrf_sets_cookie_and_returns_token(self):
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("csrftoken", response.cookies)
        self.assertTrue(response.data["csrfToken"])

    def test_login_requires_csrf_token(self):
        client = APIClient(enforce_csrf_checks=True)
        self.assertEqual(self.login(client=client).status_code, 403)

        token = client.get("/api/auth/csrf/").data["csrfToken"]
        client.credentials(HTTP_X_CSRFTOKEN=token)
        self.assertEqual(self.login(client=client).status_code, 200)

    def test_logout_requires_csrf_token_when_logged_in(self):
        client = APIClient(enforce_csrf_checks=True)
        client.credentials(HTTP_X_CSRFTOKEN=client.get("/api/auth/csrf/").data["csrfToken"])
        self.login(client=client)
        client.credentials()  # plus d'en-tête X-CSRFToken
        self.assertEqual(client.post("/api/auth/logout/").status_code, 403)

    # --- Connexion ----------------------------------------------------------

    def test_login_success_opens_session(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "admin")
        self.assertNotIn("password", response.data)
        self.assertIn("sessionid", response.cookies)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_same_error_for_every_failure(self):
        cases = [("admin", "mauvais"), ("inconnu", PASSWORD), ("visiteur", PASSWORD), ("ancien", PASSWORD)]
        for username, password in cases:
            with self.subTest(username=username):
                response = self.login(username, password)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.data, {"detail": "Identifiants incorrects."})
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_missing_fields_are_reported(self):
        response = self.client.post("/api/auth/login/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.data), {"username", "password"})

    def test_login_rate_limited_to_10_per_minute(self):
        for _ in range(10):
            self.assertEqual(self.login(password="mauvais").status_code, 400)
        self.assertEqual(self.login().status_code, 429)

    # --- me / logout ----------------------------------------------------------

    def test_me_is_401_when_anonymous(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_is_403_for_non_staff_session(self):
        self.client.force_login(self.visitor)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)

    def test_logout_closes_session(self):
        self.login()
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_logout_when_anonymous_is_harmless(self):
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)

    # --- Changement de mot de passe -----------------------------------------

    def change(self, old, new):
        return self.client.post(
            "/api/auth/change-password/", {"old_password": old, "new_password": new}, format="json"
        )

    def test_change_password_requires_login(self):
        self.assertEqual(self.change(PASSWORD, "Nouveau-Mot-2026!").status_code, 401)

    def test_wrong_old_password(self):
        self.login()
        response = self.change("mauvais", "Nouveau-Mot-2026!")
        self.assertEqual(response.status_code, 400)
        self.assertIn("old_password", response.data)

    def test_weak_new_password_is_rejected(self):
        self.login()
        for weak in ["123", "password", "admin"]:
            with self.subTest(weak=weak):
                response = self.change(PASSWORD, weak)
                self.assertEqual(response.status_code, 400)
                self.assertIn("new_password", response.data)

    def test_new_password_must_differ(self):
        self.login()
        self.assertIn("new_password", self.change(PASSWORD, PASSWORD).data)

    def test_change_password_success_keeps_session(self):
        self.login()
        response = self.change(PASSWORD, "Nouveau-Mot-2026!")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

        self.client.post("/api/auth/logout/")
        self.assertEqual(self.login(password=PASSWORD).status_code, 400)
        self.assertEqual(self.login(password="Nouveau-Mot-2026!").status_code, 200)
