# iphone app

## status

**september 27, 2026: signer chosen.** the owner approved `plumesign` (the headless CLI from [Impactor](https://github.com/claration/Impactor), Linux x86_64) installed in the nas user's `~/bin`, with no sudo, service, or network exposure. the owner types the Apple ID password and 2FA code into plumesign directly over SSH; credentials never pass through the agent or source control. `ios-sideload` now builds automatically on every push to `private/main`; the other workflows stay manual. flow: push → Codemagic builds `revision-unsigned.ipa` → copy it to the nas → `plumesign sign --apple-id --register-and-install` to the USB-connected iphone → trust the developer profile and enable Developer Mode on the phone. re-signing is still needed every seven days with a free account.

on the nas (user `okiso`, everything under the home directory):

- `~/bin/plumesign` — v2.6.3, sha256 `445edd8b…ed53b41c` checked against the GitHub release digest. its Apple session, certificate and anisette data live in `~/.config/PlumeImpactor`.
- `plumesign account login -u APPLE_ID` — run once by the owner in their own SSH session; it prompts for the password and 2FA code.
- the unsigned IPA now also builds on GitHub Actions (`.github/workflows/iphone.yml`, `macos-26`, Xcode 26.6) on every push to `private/main`, so the agent can download it with the existing `gh` login and copy it to `~/revision-ios/revision-unsigned.ipa` without a Codemagic session. Codemagic `ios-sideload` still runs too.
- `~/bin/revision-fetch` — optional alternative: downloads the newest finished Codemagic `ios-sideload` IPA using a Codemagic API token saved in `~/.config/revision/codemagic-token` (chmod 600).
- `~/bin/revision-install` — checks the USB iphone and its trust pairing, then signs and installs over the existing app (progress is kept). each install is logged to `~/revision-ios/install.log`.

**nas-only signing and refresh, confirmed september 15, 2026.** do not install or run AltServer or another signing helper on the windows pc. windows remains the source-editing machine; macOS cloud builds produce the IPA; personal signing and device communication belong on the nas. the study app itself stays installed on the iphone, not hosted on the nas. any first USB pairing must use the nas, not the pc.

the project has a Capacitor 8 iOS target and three manual Codemagic workflows. the current path is a personal, sideloaded app, not a hosted website or TestFlight. the first cloud macOS device build succeeded on september 12, 2026. personal signing, installation, and on-device update checks are still required; a successful compilation is not an iphone runtime test.

### first verified native build

- [private build 1 and downloads](https://codemagic.io/app/6aa4c3225323d0b1ab4d71e2/build/6aa4c364596dccb98d3cd135): finished in 1 minute 41 seconds on macOS M2.
- source: `ec9915d91f06b74e2ea0eb98a31c533ab9007aa8`, private repository `main`.
- artifact: `revision-unsigned.ipa`, 7.45 MB; version `1.0`, build `1`, bundle identifier `com.japaneserevision.app`.
- SHA-256 reported by the cloud packager: `950528befeed4f693921b8ad147c6c9321d9ff8d7fa22a43f85e48155d9b1143`.
- the native compiler, 36 app/config tests, seven package tests, lint, resource/plugin sync, and archive validation passed on the cloud mac. the artifact remains unsigned and requires personal signing.
- artifact downloads require the signed-in Codemagic session. no local IPA download was completed; save it under `S:\Codex\outputs\2026-09-12\revision-ios\` when downloading on windows.
- the account showed 0 of 500 free minutes used and no enabled paid subscription immediately before this run. paid billing was not enabled.
- the earlier windows AltServer installation was removed on september 15 after the owner clarified the nas-only requirement. its executable, installer archives, and the newly downloaded iTunes installer were removed. existing iTunes/iCloud installations were not changed. no iphone was signed or paired through that helper.

- display name: `revision`
- bundle identifier: `com.japaneserevision.app` (inherited from this project's desktop configuration; confirm availability in the owner's apple account before registration)
- version: `1.0`; native update number comes from the selected workflow's `BUILD_NUMBER`
- bundled renderer: `dist-ios`; no hosted website or development-server address
- saved study data: native Preferences on iOS; the existing versioned browser storage on web/desktop
- backup export: iphone share sheet, with save-to-files available; validated file import remains in settings
- lesson content, fonts, and practice are bundled; stroke-animation downloads still need internet
- browser, desktop, and iphone progress are separate. export/import a backup to transfer progress; do not uninstall the phone app to update it.

## personal development (current path)

- private development repository: `okisooo/revision-app`; the original public repository is left unchanged.
- local branch: `codex/iphone-personal`, tracking `private/main`; publish intended updates with `git push private HEAD:main`, never a public release tag during personal testing.
- edit and test on windows. Codemagic's macOS M2 worker compiles the native executable.
- run `ios-sideload`: no Apple API key, distribution certificate, App Store Connect account, or paid Apple membership is used by this workflow.
- download `revision-unsigned.ipa` and its checksum/status file from the private build artifacts. it is NOT directly installable; a compatible nas-side signer must sign it with the owner's free Apple account first. do not open or distribute it as a TestFlight build.
- complete personal signing and initial device pairing on the nas. the user handles Apple login, device trust, and any Developer Mode confirmation directly. the signing tool is not selected yet: first confirm the phone's exact iOS version, then validate a current Linux tool before giving it credentials.
- free-account apps expire after seven days unless refreshed. keep the same signing account and app identifier for updates, export a progress backup first, and install over the existing app instead of uninstalling it. native data retention still needs a real-device test.

the personal workflow is capped at 30 minutes and must be started manually. inspect remaining free cloud minutes and billing status before each run; do not enable paid billing. the existing `ios-check` is an optional compile-only diagnostic. `ios-testflight` is reserved for a later paid membership and is not the default.

## nas role and access

the nas is the required personal-signing/refresh machine, not a host for the study app and not a substitute for a macOS compiler. do not deploy the stock privileged AltServer container: it requests broad host access, and the old AltServer-Linux release has current-iOS signing compatibility reports.

verified access: web administrator `admin` and SSH user `okiso` both authenticated with the owner's earlier setup credentials. credentials were recovered from the owner's "NAS EDITS" task, not copied to project files. the nas is Debian 13 x86_64 with openmediavault 8.5.6, about 7 GiB available RAM and 53 GiB free on the OS volume. avahi and SMB are active; Docker/Podman were not installed at inspection. no signing helper or new network-exposed endpoint has been deployed. pairing files and signing credentials must stay out of source control and public endpoints.

on september 15, installed Debian's `usbmuxd`, `libimobiledevice-utils`, and `curl` with their dependencies on the nas: 13 new packages, about 4 MB installed, no existing packages upgraded or removed. started usbmuxd and verified its Unix socket and a successful empty device scan. the first immediate scan raced daemon initialization; the subsequent scan exited 0 after initialization completed. SMB, SSH, and avahi remained active. no iphone was connected, so pairing and iOS-version discovery are still pending. the system's udev rules activate usbmuxd when an Apple device is attached; no public TCP endpoint was added.

compatibility leads (not successful device tests): AltServer-Linux v0.0.5 was released in 2022; upstream issue 137 reports invalid signatures on iOS 26/27, and pull request 135 addresses a September 2026 Apple authentication change. current iloader 2.3.3 uses the maintained `isideload` apple-codesign-quick branch and supports Linux, but its distributed app is graphical. do not claim an unattended nas setup is working until personal signing, launch, refresh, and progress retention have been tested on the actual phone.

next physical step: connect the unlocked iphone directly to a nas USB port and approve its trust prompt when pairing is requested. inspect the actual iOS version before choosing a signer. do not ask the owner to install a Windows helper or pair through the pc.

## later TestFlight setup (optional, paid)

1. use the private development repository unless the owner explicitly approves publishing source.
2. sign in to Codemagic and connect only the selected repository. review permissions and any terms yourself. do not paste credentials into chat or commit them.
3. run `ios-check` first. it compiles without apple credentials and does not produce a signed installable app.
4. in the paid Apple Developer account, confirm/register the bundle identifier and create the matching iOS app record in App Store Connect. the public listing name may need to be more distinctive than the home-screen name.
5. add an App Store Connect integration in Codemagic named `revision`. use the minimum permissions required for publishing and signing. upload the private key directly into Codemagic, not into source control. signing requires an Apple Distribution certificate and a matching App Store provisioning profile; configure these in Codemagic's code signing identities.
6. create an internal TestFlight group containing only the owner. enable automatic distribution to that internal group. no external beta group or public App Store release is configured.
7. run `ios-testflight`, resolve any apple metadata/export-compliance prompts, then install the build from TestFlight on the iphone.

check the cloud account's available build allowance before starting a run; do not enable paid billing without approval. workflows are manually triggered, so normal source pushes cannot start unexpected paid builds.

## later TestFlight updates

commit the intended app changes to the selected repository, then run `ios-testflight` on that revision. keep the same bundle identifier and workflow so phone data and monotonically increasing build numbers remain consistent. TestFlight offers the replacement build after apple processing. builds expire after 90 days; this is private beta distribution, not a permanent App Store release.

## local verification on windows

Node 22 and Python 3.11+ are required for the personal package checks. run `npm test`, `npm run lint`, and `python -B -m unittest discover -s tests -p 'test_*.py'` (use `python3` on macOS). the renderer and assets can be built on windows; `xcodebuild` runs on Codemagic's mac, and AltStore handles personal signing afterward.

keep generated files on S:. the current task uses `S:\tmp\codex\nihongo-ios\` for package caches, temporary files, renderer output, and validation. create a new `dist-ios` directory junction to the renderer output before building in the existing checkout. do not relocate existing folders. Capacitor copy replaces its `public` folder, so do not depend on a junction at that final folder: run full `npm run ios:sync` in a disposable project copy on S: when verifying on windows. the icon generator also requires an S:-backed output on windows.

on the cloud mac, `npm ci`, `npm run lint`, `npm test`, and `npm run ios:sync` run before compilation. the source Xcode project uses Swift Package Manager, not CocoaPods.

## required phone checks

- install, open, and complete a 151-160 practice session.
- turn on airplane mode and verify lessons, reference words, and practice still open.
- restart the app and verify answers, notes, and the active session remain saved.
- test the keyboard, drawing pad, notch/home-indicator spacing, and landscape layout.
- export to Files and import that backup; compare the restored records.
- install a second personally signed build over the first and verify progress is preserved.
- refresh the installed app before expiry, relaunch it, and verify progress is unchanged.

## before any public release

audit curriculum and example accuracy, attribution and redistribution rights, privacy declarations, accessibility, backups, and both clean-install and update behavior. the existing textbook-linked content is not automatically cleared for commercial distribution. public iOS distribution requires the appropriate Apple membership and store review. Android packaging and store setup remain separate future work; neither store release is automated here.

## references

- [Capacitor setup](https://capacitorjs.com/docs/getting-started/environment-setup)
- [native preferences and privacy declaration](https://capacitorjs.com/docs/apis/preferences)
- [native file export and privacy declaration](https://capacitorjs.com/docs/apis/filesystem)
- [Codemagic iOS build and internal-only distribution](https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/)
- [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)
- [AltStore on windows](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows)
- [free-account refresh limits](https://faq.altstore.io/altstore-classic/your-altstore)
- [community nas refresh helper](https://github.com/dreth/Altserver-docker)
- [Codemagic free personal allowance](https://docs.codemagic.io/billing/pricing/)
