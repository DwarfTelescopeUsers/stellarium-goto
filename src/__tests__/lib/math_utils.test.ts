import {
  convertHMSToDecimalDegrees,
  convertDMSToDecimalDegrees,
  convertDecimalDegreesToDMS,
  convertDecimalHoursToHMS,
  extractDMSValues,
  extractHMSValues,
  convertHMSToDwarfRA,
  convertDMSToDwarfDec,
} from "@/lib/math_utils";

describe("convertHMSToDecimalDegrees", () => {
  it("converts hour minute seconds into decimal degrees", () => {
    let text = "3h50m10.4s";
    let expected = 57.54333;

    let res = convertHMSToDecimalDegrees(text);

    expect(res).toEqual(expected);
  });

  it("return decimal number if it is in decimal degrees", () => {
    let text = "57.54333°";
    let expected = 57.54333;

    let res = convertHMSToDecimalDegrees(text);

    expect(res).toEqual(expected);
  });

  it("otherwise, returns NaN", () => {
    let text = "random";
    let expected = NaN;

    let res = convertHMSToDecimalDegrees(text);

    expect(res).toEqual(expected);
  });

  it("converts hour minute seconds into decimal degrees for given decimal places", () => {
    let text = "3h50m10.4s";
    let decimalPlaces = 2;
    let expected = 57.54;

    let res = convertHMSToDecimalDegrees(text, decimalPlaces);

    expect(res).toEqual(expected);
  });
});

describe("convertDecimalHoursToHMS", () => {
  it("converts decimal hours to hour, minute, seconds", () => {
    let decimal = 3.83622;
    let expected = { hour: 3, minute: 50, second: 10.39 };

    let res = convertDecimalHoursToHMS(decimal);

    expect(res).toEqual(expected);
  });
});

describe("extractHMSValues", () => {
  it("returns hours, minutes, seconds from DMS string", () => {
    let text = "3h50m10.4s";
    let expected = { hour: 3, minute: 50, second: 10.4 };

    let res = extractHMSValues(text);

    expect(res).toEqual(expected);
  });
});

describe("convertDMSToDecimalDegrees", () => {
  it("converts hour minute seconds into decimal degrees", () => {
    //    let text = "30°50'10.4\"";
    //    let expected = 30.83622;
    let text = "38°47'01.29\"";
    let expected = +38.783692; //+38° 47' 01.29

    let res = convertDMSToDecimalDegrees(text);

    expect(res).toBeCloseTo(expected);
  });

  it("converts  negative hour minute seconds into decimal degrees", () => {
    let text = "-30°50'10.4\"";
    let expected = -30.83622;

    let res = convertDMSToDecimalDegrees(text);

    expect(res).toBeCloseTo(expected);
  });

  it("return decimal number if it is in decimal degrees", () => {
    let text = "30.83622°";
    let expected = 30.83622;

    let res = convertDMSToDecimalDegrees(text);

    expect(res).toEqual(expected);
  });

  it("return negative decimal number if it is in decimal degrees", () => {
    let text = "-30.83622°";
    let expected = -30.83622;

    let res = convertDMSToDecimalDegrees(text);

    expect(res).toEqual(expected);
  });

  it("otherwise, returns NaN", () => {
    let text = "random";
    let expected = NaN;

    let res = convertDMSToDecimalDegrees(text);

    expect(res).toEqual(expected);
  });

  it("converts degree minute seconds into decimal degrees for given decimal places", () => {
    let text = "30°50'10.4\"";
    let decimalPlaces = 2;
    let expected = 30.84;

    let res = convertDMSToDecimalDegrees(text, decimalPlaces);

    expect(res).toBeCloseTo(expected);
  });
});

describe("convertDecimalDegreesToDMS", () => {
  it("converts decimal degress to degress, minutes, seconds", () => {
    let decimal = 30.83622;
    let expected = { degree: 30, minute: 50, second: 10.392, negative: false };

    let res = convertDecimalDegreesToDMS(decimal);

    expect(res).toEqual(expected);
  });

  it("handles negative decimals", () => {
    let decimal = -30.83622;
    let expected = { degree: 30, minute: 50, second: 10.392, negative: true };

    let res = convertDecimalDegreesToDMS(decimal);

    expect(res).toEqual(expected);
  });
});

describe("extractDMSValues", () => {
  it("returns degree, hour, seconds from DMS string", () => {
    let text = "30°50'10.4\"";
    let expected = { degree: 30, minute: 50, second: 10.4, negative: false };

    let res = extractDMSValues(text);

    expect(res).toEqual(expected);
  });

  it("works with negative DMS string", () => {
    let text = "-30°50'10.4\"";
    let expected = { degree: 30, minute: 50, second: 10.4, negative: true };

    let res = extractDMSValues(text);

    expect(res).toEqual(expected);
  });
});

describe("convertHMSToDwarfRA", () => {
  it("returns string in 'xh xm xs' format from HMS string with hms", () => {
    let text = "18h36m56.3s";
    let expected = "18h 36m 56.3s";

    let res = convertHMSToDwarfRA(text);

    expect(res).toEqual(expected);
  });

  it("returns string in 'xh xm xs' format from HMS string with :", () => {
    let text = "18:36:56.3";
    let expected = "18h 36m 56.3s";

    let res = convertHMSToDwarfRA(text);

    expect(res).toEqual(expected);
  });

  it("returns string in 'xh xm xs' format from HMS decimal string", () => {
    let text = "18.61563";
    let expected = "18h 36m 56.26s";

    let res = convertHMSToDwarfRA(text);

    expect(res).toEqual(expected);
  });
});

describe("convertDMSToDwarfDec", () => {
  it("returns string in 'x° x' x\"' format from DMS string with °'\"", () => {
    let text = "+38°47'01.29\"";
    let expected = "+38° 47' 01.29\"";

    let res = convertDMSToDwarfDec(text);

    expect(res).toEqual(expected);
  });

  it("returns string in 'xh xm xs' format from HMS string with :", () => {
    let text = "+38:47:01.29";
    let expected = "+38° 47' 01.29\"";

    let res = convertDMSToDwarfDec(text);

    expect(res).toEqual(expected);
  });

  it("returns string in 'xh xm xs' format from HMS decimal string", () => {
    let text = "+38.7836";
    let expected = "+38° 47' 00.96\"";

    let res = convertDMSToDwarfDec(text);

    expect(res).toEqual(expected);
  });
});
