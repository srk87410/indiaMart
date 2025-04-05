/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function getParameterByName(queryString, name) {
  // Escape special RegExp characters
  name = name.replace(/[[^$.|?*+(){}\\]/g, "\\$&");
  // Create Regular expression
  var regex = new RegExp("(?:[?&]|^)" + name + "=([^&#]*)");
  // Attempt to get a match
  var results = regex.exec(queryString);
  return decodeURIComponent(results[1].replace(/\+/g, " ")) || "";
}

scrollToCard = (index) => {
  console.log("scrollToCard:", index);
  return new Promise((t, l) => {
    try {
      const item = document.querySelectorAll(".card")[index];

      item.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      t(true);
    } catch (e) {
      console.log(e);
      t(false);
    }
  });
};

timeout = (e) => {
  return new Promise((t, l) => {
    try {
      setTimeout(function () {
        t();
      }, e);
    } catch (e) {
      console.log(e);
    }
  });
};

scrapCurrentPage = (card) => {
  return new Promise((resolve, reject) => {
    let data = {};

    try {
      //Title
      try {
        data.title = card.querySelectorAll(".producttitle")[0].innerText;
      } catch (e) {
        console.log("Error: Title", e);
      }

      //Name
      try {
        data.name = card.querySelectorAll(".companyname")[0].innerText;
      } catch (e) {
        console.log("Error: Name", e);
      }

      //Website
      try {
        card.querySelectorAll(".companyname")[0].querySelector("a")
          ? (data.website = card
              .querySelectorAll(".companyname")[0]
              .querySelector("a")
              .getAttribute("href"))
          : (data.website = "");
      } catch (e) {
        console.log("Error: Link", e);
      }

      //Address
      try {
        //const address = card.querySelectorAll("#citytt" + (index + 1))[0].innerText;
        //const address = card.querySelectorAll("#citytt" + (index + 1)).querySelectorAll("p").item(0).innerText;
        const address = card
          .querySelectorAll(".newLocationUi")[0]
          .querySelectorAll("p")
          .item(0).innerText;
        data.address = address;
      } catch (e) {
        console.log("Error: Address", e);
      }

      //data.business = "";
      //data.phone  = "";
      //data.review = reviews;

      resolve(Object.keys(data).length > 0 ? data : null);
    } catch (e) {
      console.log("Error :" + e);
      resolve(null);
    }
  });
};

getMobile = (data) =>
  new Promise((response, reject) => {
    try {
      const query = data.name + " " + data.address;

      chrome.runtime.sendMessage(
        { type: "get_phone_from_address", query: query },
        (res) => {
          if (res) {
            console.log("getMobile - " + res);
            response(res ?? "");
          } else {
            response("");
          }
        }
      );
    } catch (e) {
      console.log("getMobile: Error:", e);
      response("");
    }
  });

const insertItem = (keyword, data) => {
  console.log("insertItem:", JSON.stringify(data));

  chrome.storage.local.get("scrap", function (res) {
    if (res.scrap.hasOwnProperty(keyword)) {
      //if (typeof res.scrap[keyword] !== "undefined") {
      if (res.scrap[keyword].data instanceof Array) {
        //res.scrap[keyword].data = [...res.scrap[keyword].data,data];
        res.scrap[keyword].data.push(data);
      } else {
        res.scrap[keyword].data = [data];
      }
    } else {
      res.scrap[keyword] = {
        name: keyword,
        data: [data],
      };
    }
    chrome.storage.local.set({ scrap: res.scrap });
  });
};

startScraping = (card) => {
  return new Promise(async (resolve, reject) => {
    //scroll to card
    try {
      card.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    } catch (e) {
      console.log("scrollIntoView error", e);
    }

    var cardResult = await scrapCurrentPage(card);
    if (cardResult) {
      cardResult.phone = await getMobile(cardResult);
      resolve(cardResult);
    } else {
      resolve(null);
    }
  });
};

// cards = () => {
//   const cards = document.querySelectorAll(".card");
//   return cards;
// };

(async () => {
  console.log("Scraping Started");

  //location.href.split("/").reverse()[0];
  const keyword = getParameterByName(location.href, "keyword");
  console.log("Scraping keyword:", keyword);
  const { setting } = await chrome.storage.local.get("setting");
  console.log("Scraping setting:", setting);
  var isDone = false;
  var scrapingIndex = 0;

  if (keyword) {
    while (!isDone) {
      await timeout(1000);
      await timeout((setting.delay ?? 1) * 1000);

      var cards = document.querySelectorAll(".card");
      cards = [...cards];
      console.log("Card Total:", cards.length);

      await asyncForEach(
        cards.slice(scrapingIndex, cards.length - 1),
        async (card, index) => {
          const result = await startScraping(card);
          if (result) {
            await insertItem(keyword, result);
          }
        }
      );

      //Find read more page
      try {
        var showMoreButton = document.querySelector(".showmoreresultsdiv");
        if (showMoreButton) {
          console.log("Next cards found");
          showMoreButton.click();

          //Wait for next cards
          await timeout(1000);

          const newCards = document.querySelectorAll(".card");
          console.log("New total cards:", newCards.length);

          if (cards.length === newCards.length) {
            isDone = true;
          } else {
            scrapingIndex = cards.length;
          }
        } else {
          console.log("New cards not founds");
          isDone = true;
        }
      } catch (e) {
        console.log("Read More Button Error:", e);
      }
    }

    //Auto download file
    chrome.runtime.sendMessage({
      type: "download",
      keyword: keyword,
    });

    console.log("Scraping done:", isDone);
  } else {
    console.log("Keyword not found");
  }
})();

(async () => {
  try {
    chrome.storage.onChanged.addListener(function (e, t) {
      let l = document.getElementsByClassName("collectedData").item(0),
        a = parseInt(l.innerText);
      l.innerText = ++a;
    });
  } catch (e) {
    console.log(e);
  }
})();
