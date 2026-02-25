const div = document.createElement('div');
div.style.width = '100%';
div.style.position = 'absolute';
div.style.display = 'block';
div.style.minHeight = '80px';
div.style.top = '0';
div.style.zIndex = '9999';
div.style.textAlign = 'center';
div.style.background = '#fff';
div.style.padding = '12px';

const locFallbackEntries = {
  en: 'Your web browser is out of date. For more security, comfort and the best experience on this site, please update to or use a modern browser',
  de: 'Ihr Browser ist veraltet. Für mehr Sicherheit, Komfort und die beste Erfahrung auf dieser Website, aktualisieren Sie bitte oder verwenden Sie einen modernen Browser',
  it: 'Il tuo browser non è aggiornato. Per una maggiore sicurezza, comodità e la migliore esperienza su questo sito, si prega di aggiornare o utilizzare un browser moderno.',
  'zh-HK': '您的网络浏览器已过期。为了在本网站上获得更高的安全性、舒适性和最佳体验，请更新到或使用现代浏览器',
  'zh-TW': '您的網絡瀏覽器已過期。為了在本網站上獲得更高的安全性、舒適性和最佳體驗，請更新到或使用現代瀏覽器',
  hi: 'आपका वेब ब्राउज़र पुराना हो चुका है। इस साइट पर अधिक सुरक्षा, आराम और सर्वोत्तम अनुभव के लिए, कृपया किसी आधुनिक ब्राउज़र को अपडेट करें या उसका उपयोग करें',
  es: 'Su navegador web está desactualizado. Para mayor seguridad, comodidad y la mejor experiencia en este sitio, actualice o use un navegador moderno.',
  fr: 'Votre navigateur Web est obsolète. Pour plus de sécurité, de confort et la meilleure expérience sur ce site, veuillez mettre à jour ou utiliser un navigateur moderne.',
  ar: 'متصفحك غير محدثة. لمزيد من الأمان والراحة وأفضل تجربة على هذا الموقع ، يرجى التحديث إلى متصفح حديث أو استخدامه',
  ru: 'Ваш веб-браузер устарел. Для большей безопасности, удобства и наилучшего взаимодействия с этим сайтом обновите или используйте современный браузер.',
  pt: 'Seu navegador da web está desatualizado. Para mais segurança, conforto e a melhor experiência neste site, atualize ou use um navegador moderno.',
  ko: '웹 브라우저가 오래되었습니다. 이 사이트에서 더 많은 보안, 편안함 및 최상의 경험을 위해 최신 브라우저로 업데이트하거나 사용하십시오.',
};

const userLocale = navigator.language || navigator.userLanguage;
let userLang = userLocale.split('-')[0];

let locFallbackText = locFallbackEntries[userLang] || locFallbackEntries[userLocale];
if (!locFallbackText) {
  locFallbackText = locFallbackEntries.en;
  userLang = 'en';
}

const span = document.createElement('span');
span.textContent = locFallbackText;
span.lang = userLang;
div.appendChild(span);

if (!document.body) {
  document.body = document.createElement('body');
}
document.body.insertBefore(div, document.body.firstChild);
document.body.style.visibility = 'visible';
