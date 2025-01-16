/**
 * GeoWKTer: WKT to GeoJSON Converter
 * 
 * This lightweight JavaScript library converts Well-Known Text (WKT)
 * into GeoJSON format, supporting a variety of geometry types.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * The logic is derived from Wicket.js.  <https://github.com/arthur-e/Wicket>
 * 
 * Usage:
 * const geoWKTer = new GeoWKTer();
 * geoWKTer.read("MULTIPOINT ((30 10),(10 30))");
 * const geoJSON = geoWKTer.toGeoJSON();
 */

var GeoWKTer = (function() {

  function GeoWKTer() {
    this.features = [];
  }

  /**
   * Determines if a string begins with a specified substring.
   * @param {String} str - The full string.
   * @param {String} sub - The substring to check.
   * @returns {Boolean} - True if the string begins with the substring.
   */
  function beginsWith(str, sub) {
    return str.substring(0, sub.length) === sub;
  }

  /**
   * Determines if a string ends with a specified substring.
   * @param {String} str - The full string.
   * @param {String} sub - The substring to check.
   * @returns {Boolean} - True if the string ends with the substring.
   */
  function endsWith(str, sub) {
    return str.substring(str.length - sub.length) === sub;
  }

  /**
   * Trims specified characters from the start and end of a string.
   * @param {String} str - The string to trim.
   * @param {String} [sub=' '] - The characters to trim.
   * @returns {String} - The trimmed string.
   */
  function trim(str, sub) {
    sub = sub || ' ';
    while (beginsWith(str, sub)) {
      str = str.substring(1);
    }
    while (endsWith(str, sub)) {
      str = str.substring(0, str.length - 1);
    }
    return str;
  }

  /**
   * Reads WKT strings and converts them into internal geometric representation.
   * @param {String} wktText - The WKT string to read.
   * @param {String} [label] - Optional label for the feature.
   */
  GeoWKTer.prototype.read = function(wktText, label) {
    let wktLines = wktText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    this.features = wktLines.map(line => {
      var pattern = /^\s*(\w+)\s*\((.*)\)\s*$/i;
      var matches = line.match(pattern);
      if (!matches) {
        console.error('Invalid WKT string:', line);
        return null;
      }
      const type = matches[1].toLowerCase();
      const rawCoordinates = matches[2];

      if (this.toGeoJSONHandlers[type]) {
        return {
          type: "Feature",
          geometry: this.toGeoJSONHandlers[type].call(this, rawCoordinates),
          properties: { Name: label || 'Unnamed' }
        };
      } else {
        console.error(`Unsupported WKT type: ${type}`);
        return null;
      }
    }).filter(feature => feature !== null);
  };

  /**
   * Converts the internal geometric representation into GeoJSON format.
   * @returns {Object} - A GeoJSON FeatureCollection object.
   */
  GeoWKTer.prototype.toGeoJSON = function() {
    return {
      type: "FeatureCollection",
      features: this.features
    };
  };

  /**
   * Handlers converting WKT geometries to GeoJSON.
   */
  GeoWKTer.prototype.toGeoJSONHandlers = {
    point: function(rawCoordinates) {
      const coords = rawCoordinates.split(/\s+/).map(Number);
      return { type: "Point", coordinates: coords };
    },
    multipoint: function(rawCoordinates) {
      let coords;
      if (rawCoordinates.includes('(')) {
        coords = rawCoordinates.split(/\),\s*\(/).map(point => {
          return point.replace(/[()]/g, '').split(/\s+/).map(Number);
        });
      } else {
        coords = rawCoordinates.split(/,\s*/).map(point => {
          return point.split(/\s+/).map(Number);
        });
      }
      return { type: "MultiPoint", coordinates: coords };
    },
    linestring: function(rawCoordinates) {
      const coords = rawCoordinates.split(/,\s*/).map(coordPair => coordPair.split(/\s+/).map(Number));
      return { type: "LineString", coordinates: coords };
    },
    multilinestring: function(rawCoordinates) {
      const lines = rawCoordinates.split(/\),\s*\(/).map(line => {
        return line.replace(/[()]/g, '').split(/,\s*/).map(coordPair => coordPair.split(/\s+/).map(Number));
      });
      return { type: "MultiLineString", coordinates: lines };
    },
    polygon: function(rawCoordinates) {
      const rings = rawCoordinates.split(/\),\s*\(/).map(ring => {
        return ring.replace(/[()]/g, '').split(/,\s*/).map(coordPair => coordPair.split(/\s+/).map(Number));
      });
      return { type: "Polygon", coordinates: rings };
    },
    multipolygon: function(rawCoordinates) {
      const polygons = rawCoordinates.split(/\)\),\s*\(\(/).map(polygon => {
        return polygon.replace(/^\(/, '').replace(/\)$/, '').split(/\),\s*\(/).map(ring => {
          return ring.split(/,\s*/).map(coordPair => coordPair.split(/\s+/).map(Number));
        });
      });
      return { type: "MultiPolygon", coordinates: polygons };
    },
    geometrycollection: function(rawGeometries) {
      let geometries = [];
      let depth = 0;
      let current = '';

      for (let i = 0; i < rawGeometries.length; i++) {
        const char = rawGeometries[i];
        if (char === '(') depth++;
        if (char === ')') depth--;
        current += char;
        if (depth === 0 && current !== '') {
          geometries.push(current.trim());
          current = '';
        }
      }
      if (current.length > 0) geometries.push(current.trim());

      return {
        type: "GeometryCollection",
        geometries: geometries.map(geometry => {
          const nestedPattern = /^\s*(\w+)\s*\((.*)\)\s*$/i;
          const matches = geometry.match(nestedPattern);
          if (!matches) {
            console.error('Invalid nested WKT geometry:', geometry);
            return null;
          }
          const type = matches[1].toLowerCase();
          const nestedCoords = matches[2];
          if (this.toGeoJSONHandlers[type]) {
            return this.toGeoJSONHandlers[type].call(this, nestedCoords);
          }
          return null;
        }).filter(geo => geo !== null)
      };
    }
  };

  return GeoWKTer;

})();
