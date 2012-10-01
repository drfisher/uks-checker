document.body.dataset.is_chrome_ext = 'true';
var requestObj = {refreshBadge: "true"};
if(location.pathname == '/') {
	requestObj.lastVisit = new Date().toString();
}
chrome.extension.sendRequest(requestObj, function(response) {
	//console.log(response.response);
});