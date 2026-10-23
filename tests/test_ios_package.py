import importlib.util
import json
import os
from pathlib import Path
import plistlib
import stat
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location(
    "ios_package", Path(__file__).resolve().parent.parent / "scripts/package-ios-sideload.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class IosPackageTests(unittest.TestCase):
    def setUp(self):
        scratch = Path("S:/tmp/codex/revision-ios-tests") if os.name == "nt" else Path(tempfile.gettempdir())
        scratch.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix="package-", dir=scratch)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.app = self.root / "App.app"
        (self.app / "public").mkdir(parents=True)
        (self.app / "public/index.html").write_text("study fixture", encoding="utf-8")
        (self.app / "App").write_bytes(b"test executable fixture")
        (self.app / "capacitor.config.json").write_text("{}", encoding="utf-8")
        self.info = {
            "CFBundleSupportedPlatforms": ["iPhoneOS"],
            "CFBundleIdentifier": "com.example.study",
            "CFBundleExecutable": "App",
            "CFBundleVersion": "2",
            "CFBundleShortVersionString": "1.0",
        }
        self.write_info()
        self.output = self.root / "output/revision.ipa"

    def write_info(self):
        (self.app / "Info.plist").write_bytes(plistlib.dumps(self.info))

    def package(self):
        return module.package_app(self.app, self.output, "com.example.study")

    def test_valid_archive_has_payload_executable_content_and_unsigned_metadata(self):
        result = self.package()
        with zipfile.ZipFile(self.output) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(archive.read("Payload/App.app/public/index.html"), b"study fixture")
            self.assertTrue(archive.getinfo("Payload/App.app/App").external_attr >> 16 & stat.S_IXUSR)
            self.assertTrue(all(name.startswith("Payload/App.app/") for name in archive.namelist()))
        self.assertFalse(result["signed"])
        self.assertEqual(result["build"], "2")
        self.assertEqual(len(result["sha256"]), 64)
        self.assertEqual(json.loads(self.output.with_suffix(".json").read_text()), result)

    def test_rejects_simulator_build(self):
        self.info["CFBundleSupportedPlatforms"] = ["iPhoneSimulator"]
        self.write_info()
        with self.assertRaisesRegex(ValueError, "physical iPhone"):
            self.package()

    def test_rejects_wrong_bundle(self):
        self.info["CFBundleIdentifier"] = "com.example.other"
        self.write_info()
        with self.assertRaisesRegex(ValueError, "identifier"):
            self.package()

    def test_rejects_missing_executable_or_bundled_interface(self):
        for target in ("App", "public/index.html"):
            with self.subTest(target=target):
                path = self.app / target
                content = path.read_bytes()
                path.unlink()
                with self.assertRaises(ValueError):
                    self.package()
                path.write_bytes(content)

    def test_rejects_hosted_renderer(self):
        (self.app / "capacitor.config.json").write_text(
            json.dumps({"server": {"url": "http://192.168.0.250:5178"}}), encoding="utf-8"
        )
        with self.assertRaisesRegex(ValueError, "hosted"):
            self.package()

    def test_rejects_credentials(self):
        (self.app / "private.p8").write_text("test fixture, not a credential", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "credentials"):
            self.package()

    def test_preserves_existing_artifact(self):
        self.output.parent.mkdir()
        self.output.write_bytes(b"existing artifact")
        with self.assertRaisesRegex(ValueError, "already exists"):
            self.package()
        self.assertEqual(self.output.read_bytes(), b"existing artifact")
