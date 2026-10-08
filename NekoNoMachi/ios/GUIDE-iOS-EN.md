# Neko no Machi on iPhone & iPad

This Xcode project packages the game as a real iPhone/iPad app (iOS/iPadOS 16 or later), played in landscape with touch controls – or with a keyboard on iPad. The game follows the device language (German or English) and can be switched under **Settings → Language**.

## Install it on your device
1. Double-click `NekoNoMachi.xcodeproj` to open it in Xcode (free on the Mac App Store).
2. Click the blue **NekoNoMachi** project → **Signing & Capabilities**.
3. Under **Team**, choose your Apple ID (*Add an Account…* if empty).
4. The **Bundle Identifier** is set to `app.nekonomachi`. In-app purchase: `app.nekonomachi.fullversion` (chapters 4–8).
5. Connect your iPhone/iPad, unlock it and tap “Trust this computer”.
6. Select your device at the top and click **▶ Run**.
7. First launch on the device: **Settings → General → VPN & Device Management** → your developer entry → **Trust**. On newer iPhones also enable **Settings → Privacy & Security → Developer Mode**.

With a free Apple ID the app runs for 7 days – just click ▶ again in Xcode. Distributing via TestFlight or the App Store requires the Apple Developer Program ($99/year).

## Touch controls
| Button | Action |
|---|---|
| ◀ ▶ | walk |
| ⇧ Run | toggle running |
| 🐾 Jump | jump – again in the air for a double jump, hold for higher |
| ▼ | drop down from a roof or fence |
| 😺 Meow | meow – make friends |
| 💤 Sit | sit / sleep |
| ☰ | menu |

## Changing the game
The game lives in `NekoNoMachi/web` (same files as `../app`). After changes in `../app`, run `./sync-web.sh` and run the app again in Xcode.
