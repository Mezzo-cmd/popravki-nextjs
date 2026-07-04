# Cloudflare защита — инструкции

Cloudflare е безплатен и дава най-силна защита от ботове и DDoS.

## Стъпка 1 — Регистрация
1. Отиди на https://cloudflare.com и създай безплатен акаунт
2. Кликни "Add a Site" и въведи домейна си (напр. popravki.net)
3. Избери Free план

## Стъпка 2 — Смени DNS сървърите
Cloudflare ще ти даде 2 nameserver адреса, напр.:
- `aria.ns.cloudflare.com`
- `bob.ns.cloudflare.com`

Влез в контролния панел на регистратора на домейна ти (напр. register.bg, superhosting.bg)
и смени DNS сървърите с тези от Cloudflare. Отнема до 24 часа.

## Стъпка 3 — Включи Bot Fight Mode
1. В Cloudflare → Security → Bots
2. Включи **Bot Fight Mode** (безплатно)
3. Включи **Browser Integrity Check**

## Стъпка 4 — WAF правила (Web Application Firewall)
1. Security → WAF → Managed Rules
2. Включи **Cloudflare Managed Ruleset** (безплатно)

## Стъпка 5 — DDoS защита
Активира се автоматично щом минеш през Cloudflare.
Оранжевият облак до DNS записите означава "защитен от Cloudflare".

## Стъпка 6 — Rate Limiting (по желание, Pro план)
Ако искаш по-строг rate limiting → Security → WAF → Rate Limiting Rules.
На Free плана ние вече имаме rate limiting директно в кода (middleware.ts).

## Стъпка 7 — SSL
1. SSL/TLS → Overview → избери **Full (strict)**
2. SSL/TLS → Edge Certificates → включи **Always Use HTTPS**

## Резултат
- ✅ DDoS защита
- ✅ Блокиране на злонамерени ботове
- ✅ Безплатен SSL сертификат
- ✅ CDN — сайтът се зарежда по-бързо
- ✅ Скриване на истинския IP на сървъра
