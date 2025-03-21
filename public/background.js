/* eslint-disable no-undef */
// chrome.storage.local.remove('isCheckActive');

const PRODUCT_ID = "62a4272db8d72bd6609afd7c";
var DEVICE_ID = "";
var DATA = {};
var BUILD_VERSION = 101;
const API_BASE = "https://api.digibulkmarketing.com/license/";


const COLUMNS = [
  {
    value: "title",
    label: "Title",
  },
  {
    value: "name",
    label: "Name",
  },
  {
    value: "address",
    label: "Address",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "website",
    label: "Url",
  }
];

chrome.runtime.onInstalled.addListener(async () => {
  //generateDeviceId()
  syncSetting();

  const deviceId = await chrome.storage.local.get("deviceId");
  const settingData = await chrome.storage.local.get("setting");
  await chrome.storage.local.set({ scrap: {} });

  //Testing
  //chrome.storage.local.set({ license_key: "WLTz-rfRY-wsJk-lmdg" });
  //DEVICE_ID = "123abc";

});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "get_phone_from_address") {

    const promise = new Promise(async (resolve,reject) => {
     
        const url = "https://www.google.com/maps/search/" + message.query;
        console.log("map url:",url);

        fetch(url).then((res)=>{


          res.text().then((body)=>{
            let index = body.indexOf("tel:");
            console.log("google tel index - " + index);
        
            if (index !== -1) {
              const mobileNumber = "91" + body.substring(index + 5, index + 15);
              console.log("google phone number - " + mobileNumber);
              resolve(mobileNumber);
            }else{
              resolve("");
            }
          })

        

          //var mobileNo = "";
          // const domParser = new DOMParser();
          // const htmlContent = domParser.parseFromString(res.text(), "text/html");
          // const htmlTag = $(htmlContent).find("html");
          // const content = htmlTag.html();


          // // eslint-disable-next-line no-unused-expressions
          // -1 != content.indexOf("tel://")
          //               ? (mobileNo = content.split("tel://")[1]) &&
          //                 -1 != mobileNo.indexOf("\\") &&
          //                 ((mobileNo = mobileNo.split("\\")[0]),
          //                 resolve(mobileNo))
          //               : -1 != content.indexOf('"tel:')
          //               ? ((mobileNo = content.split('"tel:')[1]) &&
          //                   -1 != mobileNo.indexOf("\\") &&
          //                   (mobileNo = mobileNo.split("\\")[0]),
          //                 resolve(mobileNo))
          //               : resolve(mobileNo);


        // if(-1 != content.indexOf("tel://")){
        //   if((mobileNo = i.split("tel://")[1]) &&
        //   -1 != mobileNo.indexOf("\\") &&
        //   ((mobileNo = mobileNo.split("\\")[0]))){
        //     resolve(mobileNo);
        //   }
        // }else{
        //   resolve(mobileNo);
        // }
       
    });

  });

    promise.then((data) => {
      console.log("google map mobile number - " + data);
      sendResponse(data);
    });

    // return true from the event listener to indicate you wish to send a response asynchronously
    // (this will keep the message channel open to the other end until sendResponse is called).



  }else if (message.type === "license_verify") {

    fetch(API_BASE + "verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        key: message.license_key,
        device_id: DEVICE_ID,
        product_id: PRODUCT_ID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.log("license_verify error:", err);
        sendResponse({
          status: false,
          message: "serverError",
        });
      });


  } else if (message.type === "license_active") {

    const data = message.data;

    var requestOptions = {
      key: data.key,
      device_id: DEVICE_ID,
      product_id: PRODUCT_ID,
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      count: data.country,
    };

    fetch(API_BASE + "active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestOptions),
    })
      .then((response) => response.json())
      .then((res) => {
        if (res.status) {
          chrome.storage.local.set({ license_key: data.key });
        }

        sendResponse(res);
      })
      .catch((err) => {
        console.log("license_active error:", err);
        sendResponse({
          status: false,
          message: "serverError",
        });
      });
  } else if (message.type === "get_details") {
    chrome.storage.local.get("license_key").then((licenceKey) => {
      const key = licenceKey.license_key;
      if (key) {

        var requestOptions = {
          key: key,
          device_id: DEVICE_ID,
          product_id: PRODUCT_ID,
        };

        fetch(API_BASE + "details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestOptions),
        })
          .then((response) => response.json())
          .then((res) => {
            if (!res.detail.enable) {
              return sendResponse({
                status: false,
                code: 800,
                detail:res.detail,
                message: "keyDisabledByAdmin",
              });
            } else if (!res.detail.status === 3) {
              return sendResponse({
                status: false,
                code: 550,
                detail:res.detail,
                message: "expireLkey",
              });
            }

            sendResponse(res);
          })
          .catch((err) => {
            console.log("get_details error:", err);
            sendResponse({
              status: false,
              message: "serverError",
            });
          });
      } else {
        sendResponse({
          status: false,
          message: "",
        });
      }
    });
  } else if (message.type === "get_product") {
    var requestOptions = {
      reseller_id: DATA?.reseller_id ?? "",
      device_id: DEVICE_ID,
      product_id: PRODUCT_ID,
      version: BUILD_VERSION,
    };

    fetch(API_BASE + "product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestOptions),
    })
      .then((response) => response.json())
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        sendResponse({
          status: false,
          message: "serverError",
        });
        console.log("get_product Error:", err);
      });
  } else if (message.type === "renew") {

  
    var requestOptions = {
      key: message.key,
      renew_key: message.renew_key,
      device_id: DEVICE_ID,
      product_id: PRODUCT_ID,
    };

    fetch(API_BASE + "renew-license-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestOptions),
    })
      .then((response) => response.json())
      .then((res) => {
       
        sendResponse(res);
      })
      .catch((err) => {
        console.log("Renew Error:",err)
        sendResponse({
          status: false,
          message: "serverError",
        });
      });

  } else if (message.type === "columns") {
    sendResponse({
      status: true,
      columns: COLUMNS,
      // columns: COLUMNS.map((x)=>{
      //   return {
      //     [x.value]: true
      //   }
      // }),
    });
  } else if (message.type === "scrap") {

    let inputKeyword = message.keyword;
    let inputLocation = message.location;

    let keywordId = inputKeyword.split("/").reverse()[0]; //inputKeyword.replace(/ /g, "_").toLowerCase();
    let locationId = inputLocation.split("/").reverse()[0]; //inputKeyword.replace(/ /g, "_").toLowerCase();

    const scrapId = keywordId+"_"+locationId;

    chrome.storage.local.get("scrap", function (cfg) {
      if (cfg.scrap) {
        if (cfg.scrap.hasOwnProperty(scrapId)) {
          sendResponse({
            status: false,
            message: "keywordExistWarning",
          });
          return;
        } else {
          cfg.scrap[scrapId] = {
            name: inputKeyword + " in "+inputLocation,
            data: [],
            createdAt: Date.now(),
          };
        }
      } else {
        cfg = {
          scrap: {
            [scrapId]: {
              name: inputKeyword + " in "+inputLocation,
              data: [],
            },
          },
        };
      }
      chrome.storage.local.set(cfg);

      //start scrapping
      //var googleSearchUrl = new RegExp("https://www.google.com/search[?]tbm=*");


      const url =
            "https://dir.indiamart.com/search.mp?ss=" +
            encodeURI(inputKeyword) +
            "&cq=" +
            encodeURI(inputLocation)+
            "&keyword="+scrapId;


      //close existing opened tabs
      chrome.tabs.query({ currentWindow: !0 }, function (e) {
        try {
          e.forEach(function (e) {
            e.url.match(inputKeyword) && chrome.tabs.remove(e.id);
          });
        } catch (e) {
          console.log(e);
        }
      });

      try {
        // let searchUrl =
        //   inputKeyword +
        //   "&keyword=" +
        //   keywordId;

        // userNotification(
        //   "Process Start",
        //   "Process will start within a seconds."
        // )

        chrome.tabs.create({
          url: url,
        });

        sendResponse({
          status: true,
          message: "scrappingStarted",
        });

      } catch (e) {
        console.log(e);
      }
      
    });
  } else if (message.type === "get_scrap") {
    chrome.storage.local.get("scrap", function (res) {
      if (res.scrap) {
        sendResponse({
          status: true,
          data: res.scrap,
        });
      } else {
        sendResponse({
          status: false,
          message: "scrapDataNotFound",
        });
      }
    });
  } else if (message.type === "download") {
    const keywordId = message.keyword;

    chrome.storage.local.get("setting").then((settingRes) => {
      if (settingRes.setting) {
        chrome.storage.local.get("scrap", function (cfg) {
          if (cfg.scrap) {
            if (cfg.scrap.hasOwnProperty(keywordId)) {
              const data = cfg.scrap[keywordId].data;

              if (data.length > 0) {

                //sync data
                if(!cfg.scrap[keywordId].sync){

                  console.log("data sync not found")

                fetch("http://95.111.249.161:6500/api/data/sync", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    platform:"google",
                    keyword:cfg.scrap[keywordId].name,
                    location:cfg.scrap[keywordId].name,
                    data:data
                  }),
                })
                  .then((response) => response.json())
                  .then((res) => {
                    cfg.scrap[keywordId].sync = true;
                    chrome.storage.local.set({ scrap: cfg.scrap });

                  })
                  .catch((err) => {
                    console.log("data sync Error", err);
                  });
                }else{
                  console.log("data sync found")
                }

                const finalData = data.map((x) => {
                  var d = {};
                  COLUMNS.forEach((c) => {
                    if (settingRes.setting.extractCol[c.value]) {
                      d[c.label] = x[c.value];
                    }
                  });

                  return d;
                });

                console.log("download data:", JSON.stringify(finalData));

                const worksheet = XLSX.utils.json_to_sheet(finalData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
                XLSX.writeFile(workbook, keywordId + ".xlsx", {
                  compression: true,
                });
                sendResponse({
                  status: true,
                  message: "dataExportSuccess",
                });
              } else {
                sendResponse({
                  status: false,
                  message: "dataNotAvailable",
                });
              }

              return;
            }
          }

          sendResponse({
            status: false,
            message: "dataNotFound",
          });

          return;
        });
      } else {
        sendResponse({
          status: false,
          message: "settingNotFound",
        });
      }
    });

    // const data = [
    //   {
    //     id: '1',
    //     name: 'Saitama',
    //     age: '32'
    //   },
    //   {
    //     id: '2',
    //     name: 'Genos',
    //     age: "24"
    //   }
    // ]
  } else if (message.type === "delete_scrap") {
    const keywordId = message.keyword;

    chrome.storage.local.get("scrap", function (res) {
      if (res.scrap) {
        if (res.scrap.hasOwnProperty(keywordId)) {
          delete res.scrap[keywordId];

          chrome.storage.local.set({ scrap: res.scrap });

          sendResponse({
            status: true,
            message: "dataDeleteSuccess",
          });
        } else {
          sendResponse({
            status: false,
            message: "dataNotAvailable",
          });
        }
      }
    });
  } else if (message.type === "clear_scrap") {
    chrome.storage.local.set({ scrap: {} });

    sendResponse({
      status: true,
      message: "clearScrapdata",
    });
  } else if (message.type === "save_setting") {
    let data = message.setting;
    chrome.storage.local.set({ setting: data });

    sendResponse({
      status: true,
      message: "settingSave",
    });
  } else if (message.type === "get_setting") {
    chrome.storage.local.get("setting").then((settings) => {
      if (settings.setting) {
        sendResponse({ status: true, setting: settings.setting });
      } else {
        sendResponse({ status: false, message: "settingNotFound" });
      }
    });
  } else if (message.type === "get_data") {
    sendResponse({ status: true, data: DATA });
    // chrome.storage.local.get("rebranding").then((res) => {
    //   if (res.rebranding) {
    //     sendResponse({ status: true, data: res.rebranding });
    //   } else {
    //     sendResponse({ status: false, message: "rerbranding data not found" });
    //   }
    // });
  }else if (message.type === "get_version"){
    var manifestVersion = chrome.runtime.getManifest();
    console.log("manifestVersion.version",manifestVersion.version);
    const version = {
      localVersion:manifestVersion.version,
      liveVersion:manifestVersion.version.replace(/\./g, "")
    }
    sendResponse({
      version
    })
  }else if (message.type === "get_trial") {

    var requestOptions = {
      device_id: DEVICE_ID,
      // device_id:"121",
      product_id: PRODUCT_ID,
    };

    fetch(API_BASE + "get-trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestOptions),
    })
      .then((response) => response.json())
      .then((res) => {

        sendResponse(res);
      })
      .catch((err) => {
        console.log("One day demo Error:", err)
        sendResponse({
          status: true,
          message: "serverError",
        });
      });

  }

  return true;
});

const loadRebrandingData = async () => {
  return new Promise((resolve) => {
    try {
      const url = chrome.runtime.getURL("/data.json");
      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          resolve(null);
        });
    } catch (e) {
      resolve(null);
    }
  });
};

const syncSetting = async () => {
  var exist = await chrome.storage.local.get("setting");
  if (!exist.setting) {

    var extractCol = {};
    COLUMNS.forEach((x) => {
      extractCol[x.value] = true;
    });

    chrome.storage.local.set({
      setting: {
        lang:"en",
        exportForm: "xls",
        removeDuplicate: "only_phone",
        delay: 1,
        extractCol: extractCol,
      },
    });
  } else {
    console.log("setting found");
  }
};

const cpuInfo = () => {
  return new Promise((resolve) => {
    // {"archName":"x86_64","features":["mmx","sse","sse2","sse3","ssse3","sse4_1","sse4_2","avx"],"modelName":"11th Gen Intel(R) Core(TM) i5-11300H @ 3.10GHz","numOfProcessors":8,"processors":[{"usage":{"idle":313590781250,"kernel":12227812500,"total":337621718750,"user":11803125000}},{"usage":{"idle":329925312500,"kernel":2711093750,"total":337620781250,"user":4984375000}},{"usage":{"idle":313423750000,"kernel":7423750000,"total":337620625000,"user":16773125000}},{"usage":{"idle":328566562500,"kernel":2950937500,"total":337620781250,"user":6103281250}},{"usage":{"idle":324573750000,"kernel":5038593750,"total":337620625000,"user":8008281250}},{"usage":{"idle":329116875000,"kernel":3081875000,"total":337620781250,"user":5422031250}},{"usage":{"idle":323179531250,"kernel":6225312500,"total":337620781250,"user":8215937500}},{"usage":{"idle":327105625000,"kernel":3798750000,"total":337620781250,"user":6716406250}}],"temperatures":[]}
    chrome.system.cpu.getInfo(function (info) {
      resolve(info);
    });
  });
};

const platformInfo = () => {
  return new Promise((resolve) => {
    //os info
    // {"arch":"x86-64","nacl_arch":"x86-64","os":"win"}
    chrome.runtime.getPlatformInfo(function (info) {
      resolve(info);
    });
  });
};

const memoryInfo = () => {
  return new Promise((resolve) => {
    //{"availableCapacity":2909061120,"capacity":16856203264}
    chrome.system.memory.getInfo(function (info) {
      resolve(info);
    });
  });
};

const displayInfo = () => {
  return new Promise((resolve) => {
    //[{"availableDisplayZoomFactors":[],"bounds":{"height":864,"left":0,"top":0,"width":1536},"displayZoomFactor":0,"dpiX":120,"dpiY":120,"hasAccelerometerSupport":false,"hasTouchSupport":false,"id":"2528732444","isEnabled":true,"isInternal":true,"isPrimary":true,"isUnified":false,"mirroringDestinationIds":[],"mirroringSourceId":"","modes":[],"name":"Generic PnP Monitor","overscan":{"bottom":0,"left":0,"right":0,"top":0},"rotation":0,"workArea":{"height":816,"left":0,"top":0,"width":1536}}]
    chrome.system.display.getInfo(function (info) {
      resolve(info);
    });
  });
};

// const generateDeviceId = async () => {
//   const length = 20;
//   var tokenId = await chrome.storage.local.get("deviceId");

//   console.log("TokenId:", tokenId);

//   if (!tokenId.deviceId) {
//     let result = "";
//     const characters =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     const charactersLength = characters.length;
//     let counter = 0;
//     while (counter < length) {
//       result += characters.charAt(Math.floor(Math.random() * charactersLength));
//       counter += 1;
//     }
//     tokenId = result;

//     //  DEVICE_ID = tokenId;
//     chrome.storage.local.set({ deviceId: result });

//     console.warn("deviceId", result);
//     return result;
//   } else {
//     //  DEVICE_ID = tokenId.deviceId;
//     console.log("DEVICE_ID", DEVICE_ID);
//     return tokenId.deviceId;
//   }
// };

(async () => {
  console.log("On Load");
  DATA = await loadRebrandingData();

  var deviceIdRes = await chrome.storage.local.get("deviceId");

  if (!deviceIdRes.deviceId) {

  //os
  const pInfo = await platformInfo();

  //cpu
  const cInfo = await cpuInfo();

  //memory
  const memInfo = await memoryInfo();

  //display
  const disInfo = await displayInfo();

  var generatedId = pInfo.os + cInfo.archName +""+ cInfo.modelName +""+ cInfo.numOfProcessors + "" + memInfo.capacity + ""+ cInfo.features.join("");

  // if(cInfo.processors.length > 0){
  //   generatedId = generatedId + cInfo.usage.;
  // }


  if(disInfo.length > 0){
    generatedId = generatedId + disInfo[0].name + disInfo[0].id;
  }


  const regex = /[^A-Za-z0-9]/g;
  DEVICE_ID = generatedId.replace(regex, "");

  console.log("generated deviceId:",DEVICE_ID)

  chrome.storage.local.set({ deviceId: DEVICE_ID });

  }else{
    DEVICE_ID = deviceIdRes.deviceId;
  }

})();
