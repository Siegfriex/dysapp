function includeHTML() {
    var z, i, elmnt, file, xhttp;
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        file = elmnt.getAttribute("data-include-path");

        if (file) {
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    elmnt.innerHTML = this.responseText;
                    elmnt.removeAttribute("data-include-path");
                    includeHTML();
                }
            };

            xhttp.open("GET", file, true);
            xhttp.send();
            return;
        }
    }
}
includeHTML();




// 프롬포트에 작성된 값을 가져와서 사용할 수 있는 코드입니다! 혹시 몰라 추가로 넣어둬요!
// document.getElementById('sendBtn').addEventListener('click', () => {
//     const text = document.querySelector('.prompt').value;
//     console.log(text); // 여기서 서버로 보내거나, 화면에 표시하거나 등 원하는 작업 가능
// });