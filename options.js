//  инициализация
function init(){

	//  позиционирование
	layout_to_center();
	window.onresize = layout_to_center;

	//  заполнение параметрами из localStorage
	var showBalance = $('#showBalance'),
		newsNumber = $('#newsNumber');
	if(localStorage['showBalance'] == 'true') showBalance.attr('checked', true);
	newsNumber.val(localStorage['newsNumber']);
	newsNumLabel(localStorage['newsNumber']);

	//  изменение настроек:
	//  отображение баланса
	showBalance.bind('click', function(){
		if ( showBalance.attr('checked') == 'checked' ){
			localStorage['showBalance'] = true;
		} else {
			localStorage['showBalance'] = false;
		}
		console.log(showBalance.attr('ch'));
		var requestObj = {refreshBadge: "true"};
		if(localStorage['showBalance'] == 'true'){
			requestObj['showBalance'] = 'show';
		} else {
			requestObj['showBalance'] = 'hide';
		}
		chrome.extension.sendRequest(requestObj, function(response) {
			//console.log(response.response);
		});
		save_animation();
	});
	//  количество новостей
	newsNumber.bind('change', function(){
		var num = newsNumber.val();
		localStorage['newsNumber'] = num;
		newsNumLabel(num);
		save_animation();
	});
}

//  выравнивание блока настроек по центру
function layout_to_center(){
	var layout = $('#layout'),
		cH = document.documentElement.clientHeight,
		lH = layout.height();
	if(lH < cH){
		layout.css('margin-top', Math.floor((cH - lH) / 2) + 'px');
	} else {
		layout.css('margin-top', '0px');
	}
}

//  анимация сохранения настоек
function save_animation(){
	$('#saved').fadeIn('fast', function(){
		var th = this;
		setTimeout(function(){
			$(th).fadeOut('slow');
		}, 1000);
	});
}

//  склонение слова "штука" в зависимости от числа
function newsNumLabel(val){
	switch(val){
		case '1':
			$('#newsNumber_lable').text('штуку');
			break;
		case '2':
		case '3':
		case '4':
			$('#newsNumber_lable').text('штуки');
			break;
		default:
			$('#newsNumber_lable').text('штук');
	}
}

//  старт
$(document).ready(init);