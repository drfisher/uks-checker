var timeoutDone = false,
	requestDone = false,
	preloaderDelay = 1000,
	popupFormActive = false,
	messageDelay = 2500,
	newsURL,
	blogURL,
	loginURL,
	cpanelURL,
	creditURL,
	cardURL,
	newsData,
	profile,
	isCredit;

//  инициализация
function init(){

	//  запрос к background.js за данными профиля
	chrome.extension.sendRequest({getProfile: 'true'}, function(response) {
		profile = response;
		newsURL = profile.domen + 'api/blog/posts/';
		blogURL = profile.domen + 'blog/slug/';
		loginURL = profile.domen + 'login/';
		cpanelURL = profile.domen + 'cpanel/profile/';
		creditURL = profile.domen + 'api/cpanel/services/payments/crediting/';
		cardURL = profile.domen + 'api/cpanel/services/payments/card/';

		//  запускаем таймер для удаления прелоадера
		setTimeout(function(){
			if(requestDone) displayContent();
			timeoutDone = true;
		}, preloaderDelay);

		//  делаем запрос за новостями
		$.getJSON(newsURL + localStorage['newsNumber'] + '/', function(data){
			newsData = data;
			if(timeoutDone) displayContent();
			requestDone = true;
		});
	});
}

//  построение страницы
function displayContent(){
	var content_html = '<div id="content_wrap">';
	content_html += '<div id="profile_wrap">';
	content_html += '<h1 id="username"></h1>';
	content_html += '</div>';
	content_html += '<div id="news_wrap"><h1><a href="http://www.ozersk.net" title="Перейти к списку новостей">Последние новости:</a></h1>';
	content_html += '<ul></ul>';
	content_html += '</div>';
	content_html += '<div id="footer">';
	if(profile.login){
		content_html += '<span id="card" title="Активировать карту экспресс-оплаты">Активировать карту</span> | ';
		content_html += '<span id="credit" title="Активировать услугу «Обещанный платеж»">Активировать кредит</span> | ';
	}
	content_html += '<span id="close" title="Закрыть окно расширения">Закрыть окно</span>';
	content_html += '</div>';
	content_html += '</div>';
	$('#preloader').after(content_html);

	//  заполняем профиль
	if(profile.login){
		var class_name;
		profile.balance > 0 ? class_name = 'green' : class_name = 'red';
		var balance_text = '<p>Ваш баланс: <span class="money ',
			balance_rub;
		if(profile.balance < 0) balance_rub = Math.ceil(profile.balance);
			else balance_rub = Math.floor(profile.balance);
		balance_text += class_name;
		balance_text += '">' + balance_rub + '</span> руб. <span class="money ';
		balance_text += class_name;
		balance_text += '">' + Math.round((Math.abs(profile.balance) - Math.floor(Math.abs(profile.balance))) * 100) + '</span> коп.';
		if(profile.credit > 0){
			balance_text += '<br />У вас не погашен кредит на сумму <span class="money red">' + profile.credit + '</span> руб.';
		}
		balance_text += '</p>';
		$('#username').html('<a href="' + cpanelURL + '" title="Перейти в личный кабинет">' + profile.full_name + '</a>').after(balance_text);
	} else {
		$('#username').text('Вы не авторизованы')
			.after('<p>Для доступа в личный кабинет нажмите <a href="' + loginURL + '">здесь</a>.</p>');
	}

	//  заполняем список новостей
	var newsList = $('#news_wrap ul'),
		newLabel = '<span class="new_post">новое</span>',
		lastVisit = new Date(localStorage['lastVisit']);
	for(var n in newsData){
		if(new Date(newsData[n].created) > lastVisit){
			newLabel = '<span class="new_post">новое</span>';
		}else{
			newLabel = '';
		}
		newsList.append('<li><a href="' + blogURL + newsData[n].slug + '" title="Открыть в новой вкладке">' + newsData[n].title + '</a>' + newLabel + '</li>');
	}

	//  подписываем ссылки на клик
	$('a').bind('click', function(){
		chrome.tabs.create({url: $(this).attr('href')});
		window.close();
	});

	//  события при клике на ссылки футера
	$('#close').bind('click', function(){
		window.close();
	});
	if(profile.login) $('#card, #credit').bind('click', createPopupForm);

	//  анимированное появление
	var newWidth = $('#content_wrap').width(),
		newHeight = $('#content_wrap').height();
	$('#preloader img').fadeOut('slow')
		.hide()
		.parent().animate({width: newWidth, height: newHeight}, 300, function(){
			$('#preloader').hide().next('#content_wrap').fadeIn('slow');
		});
}

//  создание формы для активации карты или кредита
function createPopupForm(event){
	if(!popupFormActive){
		popupFormActive = true;
		event.target.id == 'credit' ? isCredit = true : isCredit = false;

		//  построение формы
		var form_html = '<div id="activation_form"><h2>';
		if(isCredit) form_html += 'Активация кредита</h2>';
			else form_html += 'Активация карты</h2>';
		form_html += '<label for="actForm_tf1">';
		if(isCredit) form_html += 'Размер кредита<br />(до <span></span> руб.):</label>';
			else form_html += 'Номер карты:</label>';
		form_html += '<input id="actForm_tf1" type="text" class="text_field" />';
		form_html += '<label for="actForm_tf2">';
		if(isCredit) form_html += 'Срок действия:</label>';
			else form_html += 'PIN-код:</label>';
		if(isCredit) form_html += '<select id="actForm_tf2" class="day_select"></select>';
			else form_html += '<input id="actForm_tf2" type="text" class="text_field" />';
		form_html += '<input id="submit_btn" type="button" class="button" value="Отправить" />';
		form_html += '<input id="reset_btn" type="button" class="button" style="margin-right: 0;" value="Отмена" />';
		form_html += '</div>';
		form_html += '<div id="cover"></div>';
		$('body').prepend(form_html);

		//  анимация появления
		var actForm = $('#activation_form'),
			body = $('body'),
			mTop = Math.floor((body.height() - actForm.outerHeight()) / 2),
			mLeft = Math.floor((body.width() - actForm.outerWidth()) / 2);
		if(isCredit){
			//  прячем содержимое
			actForm.css({backgroundImage: 'url(images/preloader.gif)'}).children().css('visibility', 'hidden');

			//  делаем запрос за параметрами кредита
			$.get(creditURL, function(data){
				if(data.success){
					$('label[for="actForm_tf1"] span').text(data.max_sum);
					var sel = $('#actForm_tf2');
					for(var op in data.periods){
						sel.append('<option value="' + data.periods[op][0] + '">' + data.periods[op][1] + '</option>');
					}
					actForm.css({backgroundImage: 'none'}).children().css('visibility', 'visible');

					//  отслеживание событий для формы
					addFormEvents();
				}else{
					//  выводим сообщение об ошибке
					showMessage(data.message, false);
				}
			});
		} else {
			//  отслеживание событий для формы
			addFormEvents();
		}
		actForm.css({marginTop: mTop, marginLeft: mLeft}).fadeIn('fast');
	}
}

//  добавление для формы активации отслеживания "клавиатурных" событий
function addFormEvents(){
	//  кнопка "отправить", "отмена" и полупрозрачная ширма
	$('#submit_btn').bind('click', activationRequest);
	$('#reset_btn, #cover').bind('click', removePopupForm);

	//  клавиатура
	$(document).bind('keydown', function(event){
		switch(event.keyCode){
			case 13: // Enter
				activationRequest();
				break;
		}
	});

}

//  удаление отслеживания событий формы активации
function removeFormEvents(){
	$('#reset_btn, #cover').unbind();
	$(document).unbind('keydown');
}

//  удаление формы активации
function removePopupForm(){
	//  удаление ненужных событий
	removeFormEvents();
	//  удаление формы и ширмы
	$('#cover, #activation_form').fadeOut('slow', function(){
		$(this).remove();
	});
	popupFormActive = false;
}

//  отправка запроса активации карты или кредита
function activationRequest(){

	//  Проверка правильности заполнения формы
	if(isCredit){
		if(checkFormNum($('#actForm_tf1').val(), $('label[for="actForm_tf1"] span').text())){
			//  отправляем запрос
			$.post(creditURL, {crediting_sum: $('#actForm_tf1').val(), crediting_period: $('#actForm_tf2').val()}, function(data){
				removeFormEvents();
				showMessage(data.message, data.success);
				if(data.success) refreshBalance();
			});
		} else {
			$('#actForm_tf1, #actForm_tf2').blur();
			showMessage('Форма активации кредита заполнена неверно!', false, true);
		}
	} else {
		if(checkFormNum($('#actForm_tf1').val()) && checkFormNum($('#actForm_tf2').val())){
			//  отправляем запрос
			$.post(cardURL, {card_number: $('#actForm_tf1').val(), card_pin: $('#actForm_tf2').val()}, function(data){
				removeFormEvents();
				showMessage(data.message, data.success);
				if(data.success) {
					refreshBalance();
					$('#profile_wrap span.money').first().text(Math.floor(data.balance));
				}
			});
		} else {
			$('#actForm_tf1, #actForm_tf2').blur();
			showMessage('Форма активации карты оплаты заполнена неверно!', false, true);
		}
	}
}

//  обновление значка после форм активации
function refreshBalance(){
	chrome.extension.sendRequest({refreshBadge: 'true'}, function(response) {
		//console.log(response);
	});
}

//  вывод сообщения с последующим закрытием формы
function showMessage(message, isGood, isTemp){
	if(isTemp == undefined) isTemp = false;
	var actForm = $('#activation_form');
	var m_html = '<div id="mini-cover"><h2 class="';
	if(isGood) m_html += 'green';
		else m_html += 'red';
	m_html += '">' + message + '</h2></div>';
	actForm.prepend(m_html)
		.children('#mini-cover')
		.css({width: actForm.width() + 'px', height: actForm.height() + 'px'});
	var mTop = Math.floor((actForm.height() - $('#mini-cover h2').height()) / 2);
	$('#mini-cover h2').css({marginTop: mTop + 'px', display: 'none'})
		.fadeIn('fast', function(){
			//  удаляем
			if(isTemp){ // удаляем только сообщение
				setTimeout(function(){
					$('#mini-cover').fadeOut('fast', function(){
						$(this).remove();
					});
				}, messageDelay);
			} else { // удаляем всю форму
				setTimeout(removePopupForm, messageDelay);
			}
		});
}

//  проверка введенных в форму данных
function checkFormNum(val, max){
	var re = /^[0-9]+$/;
	if(String(val).search(re) != -1) {
		if((max && Number(max) >= Number(val)) || !max){
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

// старт
$(document).ready(init);

//