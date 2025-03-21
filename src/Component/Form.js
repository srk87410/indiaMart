/* eslint-disable */
import React, { useEffect, useState } from "react";
import "./Form.css";
import {
  Button,
  Input,
  Select,
  Checkbox,
  Form,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Modal,
  Tag,
  Alert,
  Divider,
  List,
  message,
  Carousel,
} from "antd";
import {
  PhoneOutlined,
  GlobalOutlined,
  MailOutlined,
  HomeOutlined,
  KeyOutlined,
  UserOutlined,
  PlayCircleOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import countryList from "../countryList.json";
import langList from "../lang.json";
import logo from "../images/logo.png";

const { Title, Text, Link } = Typography;
const { Option } = Select;

const FormComponent = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();

  const [rData, setRData] = useState({});
  const [theme, setTheme] = useState({ primary: "#0855a4" });
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [setting, setSetting] = useState(null);
  const [licenseDetails, setLicenseDetails] = useState(null);
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState("");
  const [scrapData, setScrapData] = useState({});
  const [selectedKeywordId, setSelectedKeywordId] = useState("select");

  // Activation form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [country, setCountry] = useState("IN");
  const [city, setCity] = useState("");
  const [key, setKey] = useState("");
  const [keyIsValid, setKeyIsValid] = useState(false);

  console.log("country", country);

  const [selectedTabId, setSelectedTabId] = useState(0);
  const [delay, setDelay] = useState(1);
  const [selectLang, setSelectLang] = useState("en");
  const [dataFormate, setDataFormate] = useState("csv");
  const [removeDuplicate, setRemoveDuplicate] = useState("only_phone");
  const [columns, setColumns] = useState([]);
  const [extractCol, setExtractCol] = useState({});
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [licenceKeyErrorMessage, setLicenceKeyErrorMessage] = useState(
    t("invalidLicenseKey")
  );
  const [renewKey, setRenewKey] = useState("");
  const [renewOpen, setRenewOpen] = useState(false);
  const [localmanifestVersion, setLocalmanifestVersion] = useState("");
  const [isUpdate, setIsUpdate] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  const renewOpenForm = () => {
    setRenewKey("");
    setRenewOpen(true);
  };

  const renewCloseForm = () => setRenewOpen(false);

  const isEmailIsValid = (emailAddress) => {
    const regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
    return regex.test(emailAddress);
  };

  const sendChromeMessage = (data, callback) => {
    try {
      chrome.runtime.sendMessage(data, (response) => callback(response));
    } catch (e) {
      console.log("sendMessage Error:", e);
      callback({ status: false, message: "Something is wrong" });
    }
  };

  const getProductData = () => {
    sendChromeMessage({ type: "get_product" }, (response) => {
      if (response.status) setProduct(response.product);
    });
  };

  const getColumns = () => {
    sendChromeMessage({ type: "columns" }, (response) => {
      setColumns(response.columns);
      response.columns.forEach((x) =>
        setExtractCol((col) => ({ ...col, [x.value]: true }))
      );
    });
  };

  const getResellerData = () => {
    sendChromeMessage({ type: "get_data" }, (response) => {
      if (response.status) {
        console.log("response getResellerData", response);

        setRData(response.data);
        setPhone("+" + response.data.country_code);
        setCountry(response.data.country);
      }
    });
  };

  const getScrapeData = () => {
    sendChromeMessage({ type: "get_scrap" }, (response) => {
      if (response.status) setScrapData(response.data);
      else setScrapData({});
    });
  };

  const getSetting = () => {
    sendChromeMessage({ type: "get_setting" }, (response) => {
      if (response.status) {
        const data = response.setting;
        setSetting(data);
        setDataFormate(data.exportForm);
        setRemoveDuplicate(data.removeDuplicate);
        setDelay(data.delay);
        setExtractCol(data.extractCol);
        setSelectLang(data.lang ?? "en");
        i18next.changeLanguage(data.lang ?? "en");
      } else message.error(t(response.message));
    });
  };

  const expireDate = () => {
    if (licenseDetails) return dateFormat(licenseDetails.expireAt);
    return "";
  };

  const dateFormat = (dateString) => {
    let expDate = new Date(dateString);
    return `${expDate.getUTCDate()}-${
      expDate.getUTCMonth() + 1
    }-${expDate.getUTCFullYear()}`;
  };

  const renewLicenseKey = () => {
    sendChromeMessage(
      { key: licenseDetails.key, renew_key: renewKey, type: "renew" },
      (response) => {
        if (response.status) {
          message.success(response.message);
          setTimeout(renewCloseForm, 500);
        } else message.error(t(response.message));
      }
    );
  };

  const getLicenseDetails = () => {
    sendChromeMessage({ type: "get_details" }, (response) => {
      if (response.status) {
        setIsLicenseValid(true);
        setLicenseMessage("");
      } else {
        setIsLicenseValid(false);
        setLicenseDetails(null);
        setLicenseMessage(response.message);
      }
      if (response.detail) {
        console.log("respone getLicenseDetails", response);

        setLicenseDetails(response.detail);
        setName(response.detail.name ?? "");
        setEmail(response.detail.email ?? "");
        setPhone(response.detail.phone ?? "");
        setCity(response.detail.place ?? "");
        setCountry(response.detail.country || "IN");
        setKey(response.detail.key ?? "");
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    getResellerData();
    getColumns();
    getSetting();
    getProductData();
    getLicenseDetails();
    getScrapeData();
  }, []);

  useEffect(() => {
    let color = "#0855a4";
    if (product) color = product.color;
    if (rData.theme_setting?.["primary-color"])
      color = rData.theme_setting["primary-color"];
    setTheme({ primary: color });
  }, [product, rData]);

  useEffect(() => {
    if (showValidation) setTimeout(() => setShowValidation(false), 2000);
  }, [showValidation]);

  useEffect(() => {
    checkLicense(key);
  }, [key]);

  const checkLicense = (key) => {
    if (key.length === 19) {
      sendChromeMessage(
        { license_key: key, type: "license_verify" },
        (response) => {
          setKeyIsValid(response.status);
          setLicenceKeyErrorMessage(response.message);
        }
      );
    } else {
      setKeyIsValid(false);
      setLicenceKeyErrorMessage(t("invalidLicenseKey"));
    }
  };

  const onActivateSubmit = () => {
    setShowValidation(true);
    if (!name || !email || !phone || !city || !country || !key) {
      return;
    } else {
      const msg = { name, email, phone: `+${phone}`, city, country, key };
      sendChromeMessage({ data: msg, type: "license_active" }, (response) => {
        if (response.status) {
          setIsLicenseValid(true);
          getLicenseDetails();
          message.success(t(response.message));
        } else message.error(t(response.message));
      });
    }
  };

  const onSaveSetting = () => {
    setShowValidation(true);
    const data = {
      exportForm: dataFormate,
      removeDuplicate,
      delay,
      extractCol,
      lang: selectLang,
    };
    sendChromeMessage({ setting: data, type: "save_setting" }, (response) => {
      if (response.status) {
        message.success(t("settingSave"));
        i18next.changeLanguage(selectLang);
      } else message.error(t("settingSaveFailed"));
    });
  };

  const onScrape = () => {
    setShowValidation(true);
    if (!keyword) return message.error(t("keywordIsRequired"));
    sendChromeMessage({ keyword, location, type: "scrap" }, (response) => {
      if (response.status) message.success(t(response.message));
      else message.error(t(response.message));
    });
  };

  const onDownloadScrapData = () => {
    sendChromeMessage(
      { type: "download", keyword: selectedKeywordId },
      (response) => {
        if (response.status) {
          message.success(t(response.message));
          setSelectedKeywordId("select");
        } else message.error(t(response.message));
      }
    );
  };

  const onDeleteScrapData = () => {
    sendChromeMessage(
      { type: "delete_scrap", keyword: selectedKeywordId },
      (response) => {
        if (response.status) {
          message.success(t(response.message));
          setSelectedKeywordId("select");
          getScrapeData();
        } else message.error(t(response.message));
      }
    );
  };

  const onClearScrapData = () => {
    sendChromeMessage(
      { type: "clear_scrap", keyword: selectedKeywordId },
      (response) => {
        if (response.status) {
          message.success(t(response.message));
          setScrapData({});
        } else message.error(t(response.message));
      }
    );
  };

  const getYoutubeThumbnail = (url, quality = "high") => {
    let videoId;
    if (url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/))
      videoId = url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/).pop();
    else if (url.match(/youtu.be\/(.{11})/))
      videoId = url.match(/youtu.be\/(.{11})/).pop();
    if (videoId) {
      const qualityKey =
        quality === "low"
          ? "sddefault"
          : quality === "medium"
          ? "mqdefault"
          : "hqdefault";
      return `http://img.youtube.com/vi/${videoId}/${qualityKey}.jpg`;
    }
    return false;
  };

  const totalSlider = () => {
    var count = 0;
    if (product != null) {
      if (product.showAd) {
        count++;
      }

      if (
        product.demoVideoUrl != "" &&
        (product.demoVideoUrl ?? "").includes("youtube.com")
      ) {
        count++;
      }

      if (product?.image) {
        count++;
      }
    }

    return count;
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Modal
        title={t("renewLicense")}
        open={renewOpen}
        onCancel={renewCloseForm}
        footer={[
          <Button key="renew" type="default" onClick={renewLicenseKey}>
            {t("renew")}
          </Button>,
          product && rData?.active_shop ? (
            <Button key="buy">
              <a
                href={product?.siteUrl || rData?.buy_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("buyNow")}
              </a>
            </Button>
          ) : null,
        ]}
      >
        <Input
          value={renewKey}
          onChange={(e) => setRenewKey(e.target.value)}
          placeholder={t("enterLicenseKey")}
          prefix={<KeyOutlined />}
          suffix={keyIsValid ? <span style={{ color: "green" }}>✓</span> : null}
        />
        <Text>{t("renewDBMbeforeExpire")}</Text>
        <br />
        <Text>{t("subscription1Y")}</Text>
        <br />
        <Text>{t("subscription3M")}</Text>
        <br />
        <Text>{t("subscription1M")}</Text>
      </Modal>

      <div
        style={{ backgroundColor: theme.primary, padding: 15, opacity: 0.9 }}
      >
        <Space
          align="center"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <img src={logo} alt={product?.name ?? ""} width={45} height={45} />
          <Title level={4} style={{ color: "white", margin: 0 }}>
            {rData?.name ?? t("imName")}
          </Title>
        </Space>
        {isLicenseValid && (
          <Space
            style={{ marginTop: 8, justifyContent: "center", width: "100%" }}
          >
            <Text style={{ color: "white" }}>{t("expireDate")}</Text>
            <Tag color="cyan">{expireDate()}</Tag>
            <Tag
              color="black"
              onClick={renewOpenForm}
              style={{ cursor: "pointer" }}
            >
              {t("renewLabel")}
            </Tag>
          </Space>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 50,justifyContent:"center",display:"flex" }}>
          <Spin
            size="large"
            tip={t("loading")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="mainBox"
          />
        </div>
      ) : (
        <div>
          {isLicenseValid ? (
            <>
              <div
                style={{
                  backgroundColor: theme.primary,
                  color: "white",
                  padding: "8px 6px",
                }}
              >
                <Row gutter={16} justify="center">
                  {["home", "data", "setting", "help"].map((tab, i) => (
                    <Col key={tab}>
                      <Button
                        type={selectedTabId === i ? "primary" : "text"}
                        onClick={() => setSelectedTabId(i)}
                        style={{
                          color: selectedTabId === i ? "white" : "inherit",
                        }}
                      >
                        {t(tab)}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>

              <div style={{ padding: 16 }}>
                {selectedTabId === 0 && (
                  <Form onFinish={onScrape} style={{ marginTop: "-25px" }}>
                    <Title level={5}>
                      {t("welcome")} {licenseDetails?.name ?? ""}
                    </Title>
                    <div>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            validateStatus={
                              keyword || !showValidation ? "" : "error"
                            }
                            help={
                              keyword || !showValidation
                                ? ""
                                : t("keywordIsRequired")
                            }
                          >
                            <Input
                              value={keyword}
                              onChange={(e) => setKeyword(e.target.value)}
                              placeholder={t("keyword")}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                           validateStatus={location || !showValidation ? "" : "error"}
                           help={
                            location || !showValidation ? "" : t("enterLocation")
                           }>
                            <Input
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder={t("enterLocation")}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <div style={{ textAlign: "center" }}>
                        <Button type="primary" htmlType="submit">
                          Start
                        </Button>
                      </div>
                    </div>
                    <Row justify="center">
                      <Col xs={24} style={{ maxWidth: "355px", marginTop: 16 }}>
                        <Carousel
                          afterChange={(step) => setActiveStep(step)}
                          autoplay
                          autoplaySpeed={10000}
                          dots={false}
                        >
                          {activeStep === 0 && product.image && (
                            <Link
                              href={product.adBannerUrl || "#"}
                              target="_blank"
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <img
                                src={product.image || ""}
                                alt="Ad Banner"
                                style={{ height: 200, width: "100%" }}
                              />
                            </Link>
                          )}

                          {activeStep === 1 &&
                            product.demoVideoUrl?.includes("youtube.com") && (
                              <Link
                                href={product.demoVideoUrl || "#"}
                                target="_blank"
                                style={{
                                  position: "relative",
                                  display: "block",
                                }}
                              >
                                <PlayCircleOutlined
                                  style={{
                                    position: "absolute",
                                    top: "40%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    fontSize: "110px",
                                    color: "grey",
                                    opacity: 0.8,
                                  }}
                                />
                                <img
                                  src={getYoutubeThumbnail(
                                    product.demoVideoUrl
                                  )}
                                  alt="Demo Video"
                                  style={{ height: 200, width: "100%" }}
                                />
                              </Link>
                            )}
                        </Carousel>

                        <Row
                          justify="space-between"
                          align="middle"
                          style={{ marginTop: 8 }}
                        >
                          <Button
                            onClick={() => setActiveStep((prev) => prev - 1)}
                            disabled={activeStep === 0}
                            icon={<LeftOutlined />}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={() => setActiveStep((prev) => prev + 1)}
                            disabled={activeStep === totalSlider() - 1}
                            icon={<RightOutlined />}
                          >
                            Next
                          </Button>
                        </Row>
                      </Col>
                    </Row>
                  </Form>
                )}

                {selectedTabId === 1 && (
                  <div>
                    {Object.keys(scrapData).length === 0 ? (
                      <Alert message={t("noDataFound")} type="warning" />
                    ) : (
                      <>
                        <Form.Item label={t("keyword")}>
                          <Select
                            value={selectedKeywordId}
                            onChange={setSelectedKeywordId}
                          >
                            <Option value="select">Select</Option>
                            {Object.keys(scrapData).map((key) => (
                              <Option key={key} value={key}>
                                {scrapData[key].name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        {selectedKeywordId !== "select" && (
                          <>
                            <Space direction="vertical">
                              <Text>
                                {t("totalData")}:{" "}
                                {
                                  (scrapData[selectedKeywordId]?.data ?? [])
                                    .length
                                }
                              </Text>
                              <Text>
                                {t("lastDate")}:{" "}
                                {dateFormat(
                                  scrapData[selectedKeywordId]?.createdAt
                                )}
                              </Text>
                            </Space>
                            <Space style={{ marginTop: 16 }}>
                              <Button
                                type="primary"
                                onClick={onDownloadScrapData}
                              >
                                {t("download")}
                              </Button>
                              <Button danger onClick={onDeleteScrapData}>
                                {t("delete")}
                              </Button>
                            </Space>
                          </>
                        )}
                        <Space style={{ marginTop: 16 }}>
                          <Button danger onClick={onClearScrapData}>
                            {t("clearAll")}
                          </Button>
                        </Space>
                      </>
                    )}
                  </div>
                )}

                {selectedTabId === 2 && (
                  <Form onFinish={onSaveSetting}>
                    <Form.Item label={t("removeDuplicate")}>
                      <Select
                        value={removeDuplicate}
                        onChange={setRemoveDuplicate}
                      >
                        <Option value="only_phone">{t("onlyPhone")}</Option>
                        <Option value="only_address">{t("onlyAddress")}</Option>
                        <Option value="phone_and_address">
                          {t("phoneAndaddress")}
                        </Option>
                      </Select>
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={12} style={{ marginTop: "-10px" }}>
                        <Form.Item label={t("delay")}>
                          <Input
                            type="number"
                            value={delay}
                            onChange={(e) => setDelay(e.target.value)}
                            min={1}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={t("language")}
                          style={{ marginTop: "-10px" }}
                        >
                          <Select showSearch value={selectLang} onChange={setSelectLang}>
                            {langList.map((lang) => (
                              <Option key={lang.key} value={lang.key}>
                                {lang.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Text strong style={{ marginTop: "-20px" }}>
                      {t("extractingCol")}{" "}
                    </Text>
                    <Row gutter={[16, 16]} style={{ marginTop: "10px" }}>
                      {columns.map((col) => (
                        <Col span={12} key={col.value}>
                          <Checkbox
                            checked={extractCol[col.value]}
                            onChange={(e) =>
                              setExtractCol((prev) => ({
                                ...prev,
                                [col.value]: e.target.checked,
                              }))
                            }
                          >
                            {t(col.label)}
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                    <Form.Item
                      style={{ justifyContent: "center", display: "flex" }}
                    >
                      <Button type="primary" htmlType="submit">
                        {t("save")}
                      </Button>
                    </Form.Item>
                  </Form>
                )}

                {selectedTabId === 3 && (
                  <div style={{ marginTop: "-20px" }}>
                    <Title level={5}>{t("helpMsg")}</Title>
                    <Text>{t("contactWithEmail")}</Text>
                    <List
                      dataSource={[
                        {
                          icon: <PhoneOutlined />,
                          label: t("phone"),
                          value: rData?.active_shop
                            ? product?.contactNumber
                            : rData?.phone,
                          href: "tel:",
                        },
                        {
                          icon: <MailOutlined />,
                          label: t("email"),
                          value: rData?.active_shop
                            ? product?.email
                            : rData?.email,
                          href: "mailto:",
                        },
                        {
                          icon: <GlobalOutlined />,
                          label: t("website"),
                          value: rData?.active_shop
                            ? product?.siteUrl
                            : rData?.siteUrl,
                          href: "",
                        },
                      ].filter((item) => item.value)}
                      renderItem={(item) => (
                        <List.Item
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <span style={{ marginRight: "15px" }}>
                            {item.icon}
                          </span>{" "}
                          {/* Icon with gap */}
                          <List.Item.Meta
                            title={item.label}
                            description={
                              <Link
                                href={`${item.href}${item.value}`}
                                target="_blank"
                              >
                                {item.value}
                              </Link>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    <Title level={5}>{t("disclaimer")}:</Title>
                    <Text>{t("imCertified")}</Text>
                  </div>
                )}
              </div>
              <Space
                style={{
                  textAlign: "center",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Text>{`V ${localmanifestVersion?.localVersion ?? ""}`}</Text>
              </Space>
            </>
          ) : (
            <div style={{ padding: 16 }}>
              <Form onFinish={onActivateSubmit} style={{marginTop:"30px"}}>
                {licenseMessage && (
                  <Alert
                    // message={t(licenseMessage)}
                    type="error" // Changed to "error" for red color
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Form.Item
                  validateStatus={name || !showValidation ? "" : "error"}
                  help={name || !showValidation ? "" : t("Name is required")}
                >
                  <Input
                    prefix={<UserOutlined />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Enter your name")}
                  />
                </Form.Item>
                <Form.Item
                  validateStatus={
                    (email && isEmailIsValid(email)) || !showValidation
                      ? ""
                      : "error"
                  }
                  help={
                    email
                      ? isEmailIsValid(email) || !showValidation
                        ? ""
                        : t("Invalid email")
                      : showValidation
                      ? t("Email is required")
                      : ""
                  }
                >
                  <Input
                    prefix={<MailOutlined />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("Enter your email")}
                  />
                </Form.Item>
                <Form.Item
                  validateStatus={phone || !showValidation ? "" : "error"}
                  help={phone || !showValidation ? "" : t("Phone is required")}
                >
                  <PhoneInput country="in" value={phone} onChange={setPhone} />
                </Form.Item>
                <Form.Item
                  validateStatus={city || !showValidation ? "" : "error"}
                  help={city || !showValidation ? "" : t("City is required")}
                >
                  <Input
                    prefix={<HomeOutlined />}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("Enter your city")}
                  />
                </Form.Item>
                <Form>
                  <Form.Item
                    validateStatus={country || !showValidation ? "" : "error"}
                    help={
                      country || !showValidation ? "" : t("Country is required")
                    }
                  >
                    <Select
                      showSearch
                      defaultValue={"IN"}
                      value={country ?? "IN"}
                      onChange={setCountry}
                      placeholder={t("Select your country")}
                    >
                      {countryList.map((x) => (
                        <Option key={x.countryCode} value={x.countryCode}>
                          {x.countryNameEn}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Form>

                <Form.Item
                  validateStatus={
                    key ? (keyIsValid ? "success" : "error") : "error"
                  }
                  help={
                    key
                      ? keyIsValid
                        ? ""
                        : t("Invalid license key")
                      : t("License key is required")
                  }
                >
                  <Input
                    prefix={<KeyOutlined />}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={t("Enter license key")}
                    suffix={
                      keyIsValid ? (
                        <span style={{ color: "green" }}>✓</span>
                      ) : null
                    }
                  />
                </Form.Item>

                <Space
                  style={{
                    justifyContent: "flex-end",
                    width: "100%",
                    marginTop: "-5p",
                  }}
                >
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      console.log("Get trial clicked");
                      // Add getTrial logic here
                    }}
                  >
                    {t("Get Trial")}
                  </span>
                </Space>

                <Form.Item
                  style={{ justifyContent: "center", display: "flex" }}
                >
                  <Space>
                    <Button type="primary" htmlType="submit">
                      {t("activate")}
                    </Button>
                    {product && rData?.active_shop && (
                      <Button>
                        <a
                          href={product?.siteUrl || rData?.buy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("buyNow")}
                        </a>
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormComponent;