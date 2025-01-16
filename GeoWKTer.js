/**
 * GeoWKTer: WKT to GeoJSON Converter
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */

var GeoWKTer = (function () {
  /**
   * Constructor for GeoWKTer.
   * Initializes regex patterns and prepares the converter for handling WKT strings and converting to GeoJSON.
   */
  function GeoWKTer() {
    this.features = [];
    this.regExes = {
      typeStr: /^\s*(\w+)\s*\((.*)\)\s*$/, // Matches WKT type and component strings
      spaces: /\s+|\+/, // Matches spaces and plus signs for coordinate splitting
      comma: /\s*,\s*/, // Matches commas, allowing for optional surrounding spaces
      parenComma: /\)\s*,\s*\(/, // Matches commas between coordinate groups in WKT
    };
  }

  /**
   * Trims a specified substring from the start and end of a string.
   *
   * @param {string} str - The string to be trimmed.
   * @param {string} sub - The substring to trim (default is whitespace).
   * @returns {string} - The trimmed string.
   */
  GeoWKTer.prototype.trim = function (str, sub) {
    sub = sub || " ";
    while (str.startsWith(sub)) {
      str = str.substring(1);
    }
    while (str.endsWith(sub)) {
      str = str.substring(0, str.length - 1);
    }
    return str;
  };

  /**
   * Parses WKT strings and associates a label with each parsed geometry.
   * Handles multi-line input, parsing each line as an individual WKT geometry.
   *
   * @param {string} wktText - The WKT string, potentially containing multiple lines.
   * @param {string} label - The label to associate with each parsed geometry.
   * @returns {Array} - An array of objects representing parsed WKT geometries.
   */
  GeoWKTer.prototype.read = function (wktText, label) {
    const lines = wktText.trim().split(/\r?\n/);

    const results = lines.map((line) => {
      line = line.trim();
      if (line) {
        const matches = this.regExes.typeStr.exec(line);
        if (matches) {
          const type = matches[1].toLowerCase();
          const base = matches[2];
          if (this.ingest[type]) {
            const components = this.ingest[type].call(this, base);
            // Return an object with the necessary parts and the label
            return { type, components, label };
          } else {
            console.error("Unsupported WKT type:", type);
          }
        } else {
          console.error("Invalid WKT string:", line);
        }
      }
      return null; // Return null if there is an error
    });

    // Filter out null results in case any line was invalid
    return results.filter((result) => result !== null);
  };

  /**
   * Converts an array of parsed WKT objects into a GeoJSON FeatureCollection.
   *
   * @param {Array} dataArray - Array of parsed WKT objects with geometry data.
   * @returns {Object} - A GeoJSON FeatureCollection object containing the features.
   */
  GeoWKTer.prototype.toGeoJSON = function (dataArray) {
    // Map each parsed data to a GeoJSON feature
    const features = dataArray.map((data) => {
      const { type, components, label } = data;
      const geometry = {
        type: type[0].toUpperCase() + type.slice(1).toLowerCase(),
      };

      if (type === "geometrycollection") {
        geometry.geometries = components.map((component) => this.toGeoJSON([component]).geometry);
      } else {
        geometry.coordinates = components;
      }

      return {
        type: "Feature",
        geometry: geometry,
        properties: {
          Name: label || "", // Add the label as the Name property in GeoJSON
        },
      };
    });

    // Return a FeatureCollection containing all features
    return {
      type: "FeatureCollection",
      features: features,
    };
  };

  /**
   * Contains methods for parsing different types of WKT geometries into coordinate arrays.
   */
  GeoWKTer.prototype.ingest = {
    /**
     * Parses a WKT POINT into a coordinate array.
     * @param {string} str - The WKT POINT string.
     * @returns {Array} - An array of coordinates for the point.
     */
    point: function (str) {
      const coords = this.trim(str).split(this.regExes.spaces).map(Number);
      return [[coords[0], coords[1]]];
    },

    /**
     * Parses a WKT MULTIPOINT into an array of coordinate arrays.
     * @param {string} str - The WKT MULTIPOINT string.
     * @returns {Array} - An array containing arrays of point coordinates.
     */
    multipoint: function (str) {
      return str.match(/\(([^)]+)\)/g).map((point) => {
        const coords = point.replace(/[()]/g, "").split(this.regExes.spaces).map(Number);
        return [coords[0], coords[1]];
      });
    },

    /**
     * Parses a WKT LINESTRING into an array of coordinate arrays.
     * @param {string} str - The WKT LINESTRING string.
     * @returns {Array} - An array containing arrays of line coordinates.
     */
    linestring: function (str) {
      return str.split(this.regExes.comma).map((pair) => {
        const coords = pair.trim().split(this.regExes.spaces).map(Number);
        return [coords[0], coords[1]];
      });
    },

    /**
     * Parses a WKT MULTILINESTRING into an array of lines, each containing an array of coordinates.
     * @param {string} str - The WKT MULTILINESTRING string.
     * @returns {Array} - An array containing arrays of lines.
     */
    multilinestring: function (str) {
      return str.match(/\(([^)]+)\)/g).map((line) => {
        return line
          .replace(/[()]/g, "")
          .split(this.regExes.comma)
          .map((pair) => {
            const coords = pair.trim().split(this.regExes.spaces).map(Number);
            return [coords[0], coords[1]];
          });
      });
    },

    /**
     * Parses a WKT POLYGON into an array of rings, each containing an array of coordinates.
     * @param {string} str - The WKT POLYGON string.
     * @returns {Array} - An array of rings with arrays of coordinates.
     */
    polygon: function (str) {
      return str.match(/\(([^)]+)\)/g).map((ring) => {
        return ring
          .replace(/[()]/g, "")
          .trim()
          .split(this.regExes.comma)
          .map((pair) => {
            const coords = pair.trim().split(this.regExes.spaces).map(Number);
            return [coords[0], coords[1]];
          });
      });
    },

    /**
     * Parses a WKT MULTIPOLYGON into an array of polygons, each containing rings of coordinates.
     * @param {string} str - The WKT MULTIPOLYGON string.
     * @returns {Array} - An array of polygons, each containing arrays of rings with coordinates.
     */
    multipolygon: function (str) {
      return str.match(/\(\(([^)]+)\)\)/g).map((polygon) => {
        return polygon
          .replace(/^\(\(*/, "")
          .replace(/\)\)*$/, "")
          .split(this.regExes.parenComma)
          .map((ring) => {
            return ring
              .trim()
              .split(this.regExes.comma)
              .map((pair) => {
                const coords = pair.trim().split(this.regExes.spaces).map(Number);
                return [coords[0], coords[1]];
              });
          });
      });
    },

    /**
     * Parses a WKT GEOMETRYCOLLECTION into an array of geometry objects, each with type and components.
     * @param {string} str - The WKT GEOMETRYCOLLECTION string.
     * @returns {Array} - An array of geometry objects each with type and components.
     */
    geometrycollection: function (str) {
      const cleanedStr = str.trim().replace(/^\(*/, "").replace(/\)*$/, "");
      let geoms = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < cleanedStr.length; i++) {
        if (cleanedStr[i] === "(") {
          if (depth === 0) start = i;
          depth++;
        } else if (cleanedStr[i] === ")") {
          depth--;
          if (depth === 0) {
            const geomStr = cleanedStr.slice(start, i + 1);
            const matches = this.regExes.typeStr.exec(geomStr);
            if (matches) {
              const type = matches[1].toLowerCase();
              const base = matches[2];
              if (this.ingest[type]) {
                const components = this.ingest[type].call(this, base);
                geoms.push({ type, components });
              } else {
                console.error(`Unsupported WKT type in GeometryCollection: ${type}`);
              }
            }
          }
        }
      }
      return geoms;
    },
  };

  return GeoWKTer;
})();
