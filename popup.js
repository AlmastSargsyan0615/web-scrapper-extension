document.getElementById('extract').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: {tabId: tabs[0].id},
        function: extractUrls
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          fetchAndDownloadData(results[0].result);
        }
      }
    );
  });
});

function extractUrls() {
  const elements = document.getElementsByClassName('pinnable_item');
  const urls = [];
  const baseUrl = "https://www.explorekingman.com";

  for (var i = 0; i < elements.length; i++) {
    var attributeValue = elements[i].getAttribute('href');
    if (attributeValue) {
      urls.push(baseUrl + attributeValue);
    }
  }

  return urls;
}

async function fetchAndDownloadData(urls) {
  const data = {};

  const responses = await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      const col2Text = cleanText(doc.querySelector('.col_2')?.innerText || '');
      const col3Text = cleanText(doc.querySelector('.col_3')?.innerText || '');
      const col4Href = cleanText(doc.querySelector('.col_4 a')?.getAttribute('href') || '');
      const col6Text = cleanText(doc.querySelector('.col_6')?.innerText || '');
      const col9Text = cleanText(doc.querySelector('.col_9')?.innerText || '');
      const col11Text = cleanText(doc.querySelector('.col_11')?.innerText || '');
      const col12Text = cleanText(doc.querySelector('.col_12')?.innerText || '');

      data[url] = {
        "Address": col2Text,
        "Phone": col3Text,
        "Official Website": col4Href,
        "Facebook": col6Text,
        "Hours": col9Text,
        "Cost": col11Text,
        "Attraction Category": col12Text
      };

    } catch (error) {
      data[url] = {
        "Error": error.message
      };
    }
  }));

  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const urlBlob = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: urlBlob,
    filename: 'responses.json'
  });
}

function cleanText(text) {
  // Keywords to remove
  const keywords = [
    "Address", "Phone", "Official Website", "Facebook", "Hours", "Cost", "Attraction Category"
  ];
  
  // Remove specific keywords while keeping the colons
  let cleanedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(?<!\\w)${keyword}(?!\\w)`, 'gi'); // Ensure keyword is a whole word
    cleanedText = cleanedText.replace(regex, '').trim();
  });

  // Remove newline characters and extra spaces
  cleanedText = cleanedText.replace(/\n/g, ' ').replace(/\s\s+/g, ' ');

  return cleanedText;
}
