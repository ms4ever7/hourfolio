# Google Play: internal testing setup

Hourfolio is distributed on Google Play only through the **internal testing** track
(like TestFlight). Nothing is published to the store. Two apps in Play Console:

| App | Package | EAS profile |
| --- | --- | --- |
| Hourfolio | `com.ms4ever7.hourfolio` | `production` |
| Hourfolio Stg | `com.ms4ever7.hourfolio.stg` | `staging` |

## Console checklist (per app)
- Create app: free, not a game, default language English (United Kingdom).
- App content declarations:
  - Privacy policy URL (needs a public page; the app is local-only and collects nothing).
  - Ads: no.
  - App access: all functionality available without login.
  - Content rating (IARC questionnaire): no violence, no user-generated sharing, no purchases. Expect "Everyone".
  - Target audience: 18+ (avoids the Families policy).
  - Data safety: no data collected, no data shared. Photos picked for avatars stay on device.
  - Government app: no. Financial features: none. Health: none (hours of hobbies, not health data).
- Internal testing: create the track, add an email list of testers, copy the opt-in link.
- Play App Signing: accept the default. The EAS keystore becomes the upload key.

## One-time setup after Google verifies the account
1. Create both apps in Play Console.
2. Google Cloud: create a service account, enable the Google Play Android Developer API, download a JSON key
   to `./play-service-account.json` (gitignored). In Play Console, Users and permissions: invite the service
   account email with the Release permission for both apps.
3. Upload the first AAB of each app by hand to the internal track (Play requires it before the API works):
   `mise exec -- bunx eas-cli build -p android --profile staging` (and `production`), download the `.aab`.
4. From then on: build, then `mise exec -- bunx eas-cli submit -p android --profile staging` (or `production`).
   Or in one go: `eas build -p android --profile staging --auto-submit`.
5. JS-only changes keep going through OTA (`update:staging` / `update:production`).

## Store listing text (minimum for internal testing; reuse later)

### English
- Name: Hourfolio
- Short description (80): Your time portfolio: every hobby is an asset, hours are the currency.
- Full description:
  Hourfolio treats your free time like a portfolio. Every hobby is an asset, and hours are the currency you invest in it.

  Log a session in a few taps and watch your capital grow. Capital never goes down; momentum fades gently when you take a break, with no red numbers and no streaks to break.

  • Portfolio: all your hobbies and rest in one place, with the hours you put into each
  • Weekly plan: set goals and spread them over your free days
  • Analytics: where your time goes, by period, with a heatmap
  • Goals: gentle weekly targets, celebrated when met
  • Recovery counts as an investment too
  • English, Ukrainian and Polish
  • Everything stays on your device. No account, no ads, no tracking.

### Українська
- Назва: Hourfolio
- Короткий опис (80): Портфель вашого часу: кожне хобі — актив, а години — валюта.
- Повний опис:
  Hourfolio розглядає вільний час як портфель. Кожне хобі — актив, а години — валюта, яку в нього вкладають.

  Записуйте заняття кількома дотиками й спостерігайте, як росте капітал. Капітал ніколи не зменшується, а імпульс м'яко згасає під час перерви: без червоних цифр і без серій, які можна обірвати.

  • Портфель: усі хобі та відпочинок в одному місці з годинами, вкладеними в кожне
  • Тижневий план: задайте цілі та розкладіть їх по вільних днях
  • Аналітика: куди йде час за періодами, з тепловою картою
  • Цілі: спокійні тижневі орієнтири, які відзначаються, коли досягнуті
  • Відновлення теж вважається інвестицією
  • Англійська, українська та польська мови
  • Усе лишається на пристрої. Без облікового запису, реклами та відстеження.

### Polski
- Nazwa: Hourfolio
- Krótki opis (80): Portfel Twojego czasu: każde hobby to aktywo, a godziny to waluta.
- Pełny opis:
  Hourfolio traktuje wolny czas jak portfel inwestycyjny. Każde hobby to aktywo, a godziny to waluta, którą w nie inwestujesz.

  Zapisuj sesje kilkoma dotknięciami i patrz, jak rośnie kapitał. Kapitał nigdy nie maleje, a rozpęd łagodnie słabnie podczas przerwy: bez czerwonych liczb i bez serii do przerwania.

  • Portfel: wszystkie hobby i odpoczynek w jednym miejscu, z godzinami włożonymi w każde z nich
  • Plan tygodnia: ustaw cele i rozłóż je na wolne dni
  • Analityka: na co idzie czas, według okresów, z mapą cieplną
  • Cele: spokojne tygodniowe założenia, odnotowane po osiągnięciu
  • Regeneracja też liczy się jako inwestycja
  • Angielski, ukraiński i polski
  • Wszystko zostaje na urządzeniu. Bez konta, reklam i śledzenia.

## Graphics still to make
- Icon 512×512 PNG (from `assets/images/icon.png`).
- Feature graphic 1024×500.
- At least 2 phone screenshots from an Android emulator (the iOS ones in `docs/app-store` are the wrong size).
