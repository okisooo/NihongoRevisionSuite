"""Package an unsigned device build for AltStore, not direct iPhone installation."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import stat
import zipfile


def package_app(app, output, expected_id):
    app, output = Path(app).resolve(), Path(output).resolve()
    if os.name == "nt" and output.drive.lower() != "s:":
        raise ValueError("Generated iPhone packages must be stored on S: on Windows.")
    if app.suffix != ".app" or not app.is_dir():
        raise ValueError("Expected an Xcode .app directory.")
    if output.suffix != ".ipa" or output.is_relative_to(app):
        raise ValueError("Choose an .ipa output outside the app bundle.")
    if output.exists() or output.with_suffix(".json").exists():
        raise ValueError("Output already exists; choose a new output path.")

    info = plistlib.loads((app / "Info.plist").read_bytes())
    if info.get("CFBundleSupportedPlatforms") != ["iPhoneOS"]:
        raise ValueError("A physical iPhone build is required, not a simulator build.")
    if info.get("CFBundleIdentifier") != expected_id:
        raise ValueError("The compiled bundle identifier does not match this app.")
    executable = info.get("CFBundleExecutable", "")
    if not executable or Path(executable).name != executable or not (app / executable).is_file():
        raise ValueError("The app executable is missing or invalid.")
    if not (app / "public/index.html").is_file():
        raise ValueError("The bundled study interface is missing. Run ios:sync first.")
    config = json.loads((app / "capacitor.config.json").read_text(encoding="utf-8"))
    if config.get("server", {}).get("url"):
        raise ValueError("The installed app must not depend on a hosted development server.")

    files = sorted(app.rglob("*"))
    for path in files:
        if path.is_symlink():
            raise ValueError("Unexpected symlink in iOS bundle; inspect the native build.")
        if path.suffix.lower() in {".p8", ".p12", ".mobileprovision"} or path.name.startswith(".env"):
            raise ValueError("Unexpected signing credentials or environment file in bundle.")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            if path.is_file():
                name = f"Payload/{app.name}/{path.relative_to(app).as_posix()}"
                entry = zipfile.ZipInfo.from_file(path, name)
                entry.create_system = 3
                mode = path.stat().st_mode
                if path == app / executable:
                    mode |= stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH
                entry.external_attr = mode << 16
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, path.read_bytes())
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError("The IPA archive failed its integrity check.")

    with output.open("rb") as stream:
        checksum = hashlib.file_digest(stream, "sha256").hexdigest()
    metadata = {
        "bundleId": expected_id,
        "version": info.get("CFBundleShortVersionString"),
        "build": info.get("CFBundleVersion"),
        "signed": False,
        "installation": "Sign and install with AltStore; this is not a TestFlight build.",
        "sha256": checksum,
    }
    output.with_suffix(".json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    project = Path(__file__).resolve().parent.parent
    bundle_id = json.loads((project / "capacitor.config.json").read_text(encoding="utf-8"))["appId"]
    print(json.dumps(package_app(args.app, args.output, bundle_id), indent=2))
