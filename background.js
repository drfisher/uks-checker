var profile = {}, // объект с данными пользователя
	requestInterval = 20 * 60000, // интервал запросов, первое число - количество минут
	timeoutID, // айдишник таймаута
	domen = 'http://www.ozersk.net/', // домен для запросов
	profileURL = domen + 'api/cpanel/user/profile/', // адрес запроса профиля пользователя
	newsURL = domen + 'api/blog/posts/'; // адрес запроса ленты новостей

//  инициализация
function init(){
	//  дефолтные настраиваемые значения localStorage
	if(!localStorage['showBalance']) localStorage['showBalance'] = 'true';
	if(!localStorage['newsNumber']) localStorage['newsNumber'] = '5';
	if(!localStorage['lastVisit']) {
		localStorage['lastVisit'] = new Date().toString();
		chrome.tabs.create({url: chrome.extension.getURL('options.html')});
	}

	//  делаем запрос на сервак для получения данных профиля
	profile.login = false;
	profile.domen = domen;
	uksRequest(profileURL, profileProcessing);

	//  подписываемся на сообщения от второстепенных скриптов
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
		if(sender.tab && request.refreshBadge == 'true' || request.refreshBadge == 'true'){
			if(request.showBalance){
				refreshIcon();
			} else {
				if (request.lastVisit) localStorage['lastVisit'] = request.lastVisit;
				uksRequest(profileURL, profileProcessing);
				sendResponse({response: "Последний визит на сайт: " + localStorage['lastVisit']});
			}
		} else if(request.getProfile == 'true'){
			sendResponse(profile);
		}
	});
}

//  обработка ответа с профилем абонента
function profileProcessing(data){

	//  обновляем таймаут
	refreshTimeout();

	if(data == null){
		return false;
	}else if(data.error){
		profile.login = false;
	} else {
		//  заполняем профиль данными из ответа
		profile.login = true;
		profile.full_name = data.full_name;
		profile.credit = data.credit;
		profile.balance = (data.balance).toFixed(2);
	}
	//  если баланс длинный, то переходим на минималистичный вариант
	if(Math.abs(Math.floor(profile.balance)) > 9999) localStorage['showBalance'] = 'false';
	//  выводим баланс на значок
	refreshIcon();

	//  запускаем проверку новых новостей
	uksRequest(newsURL + '1/', newsProcessing);
}

//  управление внешним видом иконки
function refreshIcon(){
	if(profile.login){
		if(localStorage['showBalance'] == 'true'){
			var badgeColor,
				badgeText;
			if(profile.balance > 0){
				badgeColor = [102, 204, 51, 255];
			} else {
				badgeColor = [255, 0, 0, 255];
			}
			if(profile.credit > 0) badgeColor = [127, 127, 127, 255];
			chrome.browserAction.setIcon({path:'images/icon16.png'});
			if(profile.balance < 0) {
				badgeText = Math.abs(Math.ceil(profile.balance));
				if(badgeText <= 999) badgeText *= -1;
			}
				else badgeText = Math.floor(profile.balance);
			setBadge(String(badgeText), badgeColor);
		}else{
			chrome.browserAction.setBadgeText({text:''});
			var iconPath;
			if(profile.balance > 0){
				iconPath = 'images/icon16-green.png';
			} else {
				iconPath = 'images/icon16-red.png';
			}
			if(profile.credit > 0) iconPath = 'images/icon16-grey.png';
			chrome.browserAction.setIcon({path: iconPath});
		}
		var creditMess = '';
		if(profile.credit > 0) creditMess = '\nНе погашен кредит: ' + profile.credit + ' руб.';
		chrome.browserAction.setTitle({title:'«УКС — Озерск»\n' + profile.full_name + '\nВаш баланс: ' + profile.balance + ' руб.' + creditMess});
	}else{
		setBadge('?', [127, 127, 127, 255]);
		chrome.browserAction.setIcon({path:'images/icon16.png'});
		chrome.browserAction.setTitle({title:'«УКС — Озерск»\nВы не авторизованы'});
	}
}

//  обработка ответа с заголовком последней новости
function newsProcessing(data){

	var currentNewsDate = new Date(data[0].created),
		lastVisitDate = new Date(localStorage['lastVisit']);

	if(lastVisitDate < currentNewsDate){
		//  выводим сообщение о свежей новости
		setBadge('!', [255, 0, 0, 255]);
	}
}

//  обновление таймаута
function refreshTimeout(){
	if(timeoutID) clearTimeout(timeoutID);
	timeoutID = window.setTimeout(function(){
		uksRequest(profileURL, profileProcessing);
	}, requestInterval);
}

//  запрос к серверу
function uksRequest(url, callback){
	$.getJSON(url, function(data){
		callback(data);
	});
}

//  обновление значка
function setBadge(message, bgcolor){
	chrome.browserAction.setBadgeBackgroundColor({color:bgcolor});
	chrome.browserAction.setBadgeText({text:message});
}

//  старт
$(document).ready(init);