console.log('popup.js загружен');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded сработал');
  const clickButtonTestBtn = document.getElementById('click-button-test');
  const statusDiv = document.getElementById('status');
  
  console.log('Найдена кнопка:', clickButtonTestBtn);

  // Отображение статуса
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
  }

  // Слушатель кнопки "Тест нажатия кнопки"
  clickButtonTestBtn.addEventListener('click', function() {
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Проверяем, соответствует ли URL сайту clothes.crpt.ru
      if (!activeTab.url.includes('clothes.crpt.ru')) {
        showStatus('Это расширение работает только на сайте clothes.crpt.ru', 'error');
        return;
      }
      
      // Отправляем запрос на нажатие кнопки
      chrome.tabs.sendMessage(activeTab.id, {
        type: "CLICK_ADD_BUTTON"
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка подключения к странице. Обновите страницу и попробуйте снова.', 'error');
        } else if (response && response.success) {
          showStatus('Кнопка "Добавить вручную" успешно нажата', 'success');
        } else {
          showStatus('Кнопка "Добавить вручную" не найдена на странице', 'error');
        }
      });
    });
  });
});
