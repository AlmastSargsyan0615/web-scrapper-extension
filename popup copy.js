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
  const responses = await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const spanText = doc.evaluate('/html/body/div[7]/div[1]/h1/span', doc, null, XPathResult.STRING_TYPE, null).stringValue;
      return `URL: ${url}\n\n${spanText}\n\n\n`;
    } catch (error) {
      return `URL: ${url}\n\nError: ${error.message}\n\n\n`;
    }
  }));

  const blob = new Blob(responses, {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'responses.txt'
  });
}
