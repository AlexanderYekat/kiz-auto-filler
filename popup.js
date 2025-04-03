console.log('popup.js загружен');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded сработал');
  
  // Элементы для обработки CSV
  const csvFileInput = document.getElementById('csv-file-input');
  const csvFileInfo = document.getElementById('csv-file-info');
  const processCsvButton = document.getElementById('process-csv-button');
  const fillMultipleKizButton = document.getElementById('fill-multiple-kiz-button');
  const statusDiv = document.getElementById('status');
  const progressContainer = document.getElementById('progress-container');
  const progressDetails = document.getElementById('progress-details');

  // Глобальная переменная для хранения данных КИЗ
  let globalKizValues = [];

  // Слушатель сообщений от content.js
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Получено сообщение в popup:', message);
    
    // Отображаем сообщения о прогрессе
    if (message.type === "PROGRESS_UPDATE") {
      addProgressMessage(message.message);
    }
    
    return true;
  });

  // Функция для добавления сообщения о прогрессе
  function addProgressMessage(message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.margin = '5px 0';
    messageElement.style.borderBottom = '1px dashed #ddd';
    messageElement.style.paddingBottom = '5px';
    
    progressDetails.appendChild(messageElement);
    
    // Прокручиваем до последнего сообщения
    progressDetails.scrollTop = progressDetails.scrollHeight;
    
    // Убеждаемся, что контейнер прогресса видим
    progressContainer.style.display = 'block';
    
    // Также выводим в консоль для отладки
    console.log(message);
  }
  
  // Очистка сообщений о прогрессе
  function clearProgressMessages() {
    progressDetails.innerHTML = '';
    progressContainer.style.display = 'none';
  }

  // Отображение статуса
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    
    // Добавляем автоматическое скрытие через 10 секунд для успешных сообщений
    if (type === 'success') {
      setTimeout(() => {
        if (statusDiv.textContent === message) {
          statusDiv.style.display = 'none';
        }
      }, 10000);
    }
  }
  
  // Форматирование размера файла
  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' байт';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' КБ';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
    }
  }
  
  // Слушатель выбора CSV файла
  csvFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
      csvFileInfo.textContent = 'Файл не выбран';
      processCsvButton.disabled = true;
      return;
    }
    
    if (!file.name.endsWith('.csv')) {
      showStatus('Пожалуйста, выберите файл CSV', 'error');
      csvFileInfo.textContent = 'Неверный формат файла';
      processCsvButton.disabled = true;
      return;
    }
    
    // Показываем информацию о файле
    csvFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
    processCsvButton.disabled = false;
  });
  
  // Функция для корректного разбора CSV-строки с учетом запятых и кавычек
  function parseCSVLine(line) {
    const result = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Проверяем, является ли это экранированной кавычкой (двойная кавычка)
        if (i + 1 < line.length && line[i + 1] === '"' && insideQuotes) {
          currentValue += '"'; // Добавляем одну кавычку для экранированной двойной кавычки
          i++; // Пропускаем следующую кавычку
        } else {
          insideQuotes = !insideQuotes; // Переключаем флаг нахождения внутри кавычек
        }
      } else if (char === ',' && !insideQuotes) {
        // Запятая вне кавычек означает конец значения
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Добавляем последнее значение
    result.push(currentValue);
    
    return result;
  }
  
  // Создаем контейнер для отображения результатов прямо в интерфейсе
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'csv-results';
  document.body.appendChild(resultsContainer);
  resultsContainer.style.display = 'none';
  
  // Слушатель кнопки "Обработать CSV-файл"
  processCsvButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Обработать CSV-файл"');
    
    // Очищаем результаты предыдущей обработки
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
    
    // Очищаем сообщения о прогрессе
    clearProgressMessages();
    
    // Сначала отключаем кнопку заполнения КИЗ
    fillMultipleKizButton.disabled = true;
    
    const file = csvFileInput.files[0];
    if (!file) {
      showStatus('Файл не выбран', 'error');
      return;
    }
    
    showStatus('Обработка CSV-файла...', 'info');
    processCsvButton.disabled = true;
    processCsvButton.textContent = 'Обработка...';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      console.log('📄 Файл успешно прочитан');
      const contents = e.target.result;
      
      // Отладочный вывод начала содержимого
      console.log('Первые 50 символов файла:', contents.substring(0, 50));
      
      const lines = contents.split(/\r?\n/);
      console.log('📊 CSV файл прочитан, всего строк:', lines.length);
      addProgressMessage(`CSV файл прочитан, всего строк: ${lines.length}`);
      
      if (lines.length === 0) {
        console.log('⚠️ Файл не содержит строк');
        addProgressMessage('⚠️ Файл не содержит строк');
        showStatus('Файл пуст или имеет неверный формат', 'error');
        processCsvButton.disabled = false;
        processCsvButton.textContent = 'Обработать CSV-файл';
        return;
      }
      
      // Отладочный вывод первой строки
      console.log('Первая строка CSV:', lines[0]);
      addProgressMessage(`Начало обработки строк CSV...`);
      
      const kizValues = [];
      
      lines.forEach((line, index) => {
        if (!line.trim()) {
          console.log(`Строка ${index + 1}: пустая, пропускаем`);
          return; // Пропускаем пустые строки
        }
        
        try {
          const values = parseCSVLine(line);
          
          console.log(`Строка ${index + 1}: разбор завершен, найдено ${values.length} значений`);
          
          // Пропускаем первые два значения (1 и КИЗ) и обрабатываем только остальные
          if (values.length > 2) {
            // Выводим только значения КИЗ, начиная с третьего элемента (индекс 2)
            console.log(`Строка ${index + 1}, значения КИЗ:`, values.slice(2));
            
            // Сохраняем значения для возможного дальнейшего использования
            kizValues.push({
              values: values.slice(2)
            });
            
            // Показываем пользователю каждую 10-ю строку или последнюю
            if (index % 10 === 0 || index === lines.length - 1) {
              addProgressMessage(`Обработано строк: ${index + 1} из ${lines.length}`);
            }
          } else {
            console.log(`⚠️ Строка ${index + 1}: недостаточно значений (${values.length}), ожидалось > 2`);
          }
        } catch (error) {
          console.error(`❌ Ошибка при обработке строки ${index + 1}:`, error);
        }
      });
      
      console.log('✅ Всего обработано записей с КИЗ:', kizValues.length);
      addProgressMessage(`✅ Всего обработано записей с КИЗ: ${kizValues.length}`);
      
      // Восстанавливаем кнопку
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать CSV-файл';
      
      if (kizValues.length > 0) {
        showStatus(`Успешно обработано ${kizValues.length} записей из CSV-файла`, 'success');
        
        // Сохраняем КИЗы в глобальную переменную и активируем кнопки
        globalKizValues = kizValues;
        fillMultipleKizButton.disabled = false;
        
        // Отображаем результаты прямо в интерфейсе
        resultsContainer.style.display = 'block';
        const header = document.createElement('h3');
        header.textContent = 'Результаты обработки CSV:';
        resultsContainer.appendChild(header);
        
        const info = document.createElement('p');
        info.textContent = `Обработано ${kizValues.length} строк, извлечено ${kizValues.reduce((acc, row) => acc + row.values.length, 0)} значений КИЗ.`;
        resultsContainer.appendChild(info);
        
        // Показываем первые 5 строк с КИЗ в качестве примера
        if (kizValues.length > 0) {
          const exampleHeader = document.createElement('p');
          exampleHeader.innerHTML = '<strong>Примеры КИЗ:</strong>';
          resultsContainer.appendChild(exampleHeader);
          
          const exampleList = document.createElement('ul');
          const limit = Math.min(5, kizValues.length);
          
          for (let i = 0; i < limit; i++) {
            const kizRow = kizValues[i];
            if (kizRow.values.length > 0) {
              const item = document.createElement('li');
              item.textContent = `Строка ${i + 1}: ${kizRow.values[0]}${kizRow.values.length > 1 ? ` (+ ещё ${kizRow.values.length - 1})` : ''}`;
              exampleList.appendChild(item);
            }
          }
          
          resultsContainer.appendChild(exampleList);
        }
      } else {
        showStatus('Не найдено записей с КИЗ в файле', 'error');
      }
    };
    
    reader.onerror = function(error) {
      console.error('❌ Ошибка при чтении файла:', error);
      showStatus('Ошибка чтения файла', 'error');
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать CSV-файл';
    };
    
    reader.readAsText(file, 'UTF-8'); // Явно указываем кодировку UTF-8
  });
  
  // Обработчик для кнопки "Заполнить все поля КИЗ из CSV"
  fillMultipleKizButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Заполнить все поля КИЗ из CSV"');
    addProgressMessage('Начинаем заполнение полей КИЗ...');
    
    // Проверяем, есть ли данные для заполнения
    if (globalKizValues.length === 0 || !globalKizValues[0].values || globalKizValues[0].values.length === 0) {
      showStatus('Нет данных КИЗ для заполнения полей', 'error');
      addProgressMessage('⚠️ Нет данных КИЗ для заполнения');
      return;
    }
    
    // Получаем все значения КИЗ из первой строки
    const kizValues = globalKizValues[0].values;
    console.log('Выбрано значений КИЗ для заполнения:', kizValues.length);
    addProgressMessage(`Найдено ${kizValues.length} значений КИЗ для заполнения`);
    
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Проверяем, соответствует ли URL сайту clothes.crpt.ru
      if (!activeTab.url.includes('clothes.crpt.ru')) {
        showStatus('Это расширение работает только на сайте clothes.crpt.ru', 'error');
        addProgressMessage('⚠️ Ошибка: расширение работает только на сайте clothes.crpt.ru');
        return;
      }
      
      addProgressMessage('Отправка данных на страницу...');
      
      // Отправляем запрос на создание и заполнение полей КИЗ
      chrome.tabs.sendMessage(activeTab.id, {
        type: "CREATE_AND_FILL_KIZ_FIELDS",
        kizValues: kizValues
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка подключения к странице. Обновите страницу и попробуйте снова.', 'error');
          addProgressMessage('⚠️ Ошибка подключения к странице');
        } else if (response && response.success) {
          showStatus(`Успешно создано и заполнено ${response.filledCount} полей КИЗ`, 'success');
          addProgressMessage(`✅ Успешно создано и заполнено ${response.filledCount} полей КИЗ`);
        } else {
          showStatus('Не удалось создать или заполнить поля КИЗ на странице', 'error');
          addProgressMessage('⚠️ Не удалось создать или заполнить поля КИЗ');
        }
      });
    });
  });
});
