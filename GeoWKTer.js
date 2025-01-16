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

var GeoWKTer = (function() {

    function GeoWKTer() {
        this.features = [];
        this.regExes = {
            'typeStr': /^\s*(\w+)\s*\((.*)\)\s*$/,
            'spaces': /\s+|\+/, 
            'numeric': /-?\d+(\.\d+)?/,
            'comma': /\s*,\s*/,
            'parenComma': /\)\s*,\s*\(/,
            'coord': /-?\d+\.\d+ -?\d+\.\d+/,
            'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,
            'ogcTypes': /^(multi)?(point|line|polygon|box)?(string)?$/i,
            'crudeJson': /^{.*"(type|coordinates|geometries|features)":.*}$/
        };
    }

    GeoWKTer.prototype.trim = function(str, sub) {
        sub = sub || ' ';
        while (str.startsWith(sub)) {
            str = str.substring(1);
        }
        while (str.endsWith(sub)) {
            str = str.substring(0, str.length - 1);
        }
        return str;
    };

    GeoWKTer.prototype.read = function(wktText) {
        const lines = wktText.trim().split(/\r?\n/);
        lines.forEach(line => {
            line = line.trim();
            if (line) {
                const matches = this.regExes.typeStr.exec(line);
                if (matches) {
                    this.type = matches[1].toLowerCase();
                    this.base = matches[2];
                    if (this.ingest[this.type]) {
                        this.components = this.ingest[this.type].call(this, this.base);
                    }
                    this.features.push(this.toJson(this.type, this.components));
                } else {
                    console.error('Invalid WKT string:', line);
                }
            }
        });
    };

    GeoWKTer.prototype.toJson = function(type, components) {
        var json = {
            type: type[0].toUpperCase() + type.slice(1).toLowerCase()
        };

        if (type === 'geometrycollection') {
            json.geometries = components.map(component => this.toJson(component.type, component.components));
        } else {
            json.coordinates = components;
        }

        return {
            type: "Feature",
            geometry: json,
            properties: {}
        };
    };

    GeoWKTer.prototype.ingest = {
        point: function(str) {
            const coords = this.trim(str).split(this.regExes.spaces).map(Number);
            return [{
                x: coords[0],
                y: coords[1]
            }];
        },
        multipoint: function(str) {
            return str.match(/\(([^)]+)\)/g).map(point => {
                const coords = point.replace(/[()]/g, '').split(this.regExes.spaces).map(Number);
                return { x: coords[0], y: coords[1] };
            });
        },
        linestring: function(str) {
            return str.split(this.regExes.comma).map(pair => {
                const coords = pair.trim().split(this.regExes.spaces).map(Number);
                return { x: coords[0], y: coords[1] };
            });
        },
        multilinestring: function(str) {
            return str.match(/\(([^)]+)\)/g).map(line => {
                return line.replace(/[()]/g, '').split(this.regExes.comma).map(pair => {
                    const coords = pair.trim().split(this.regExes.spaces).map(Number);
                    return { x: coords[0], y: coords[1] };
                });
            });
        },
        polygon: function(str) {
            return str.match(/\(([^)]+)\)/g).map(ring => {
                return ring.replace(/[()]/g, '').split(this.regExes.comma).map(pair => {
                    const coords = pair.trim().split(this.regExes.spaces).map(Number);
                    return { x: coords[0], y: coords[1] };
                });
            });
        },
        multipolygon: function(str) {
            return str.match(/\(\(([^)]+)\)\)/g).map(polygon => {
                return polygon.replace(/^\(\(*/, '').replace(/\)\)*$/, '').split(this.regExes.doubleParenComma).map(ring => {
                    return ring.split(this.regExes.comma).map(pair => {
                        const coords = pair.trim().split(this.regExes.spaces).map(Number);
                        return { x: coords[0], y: coords[1] };
                    });
                });
            });
        },
        geometrycollection: function(str) {
            const cleanedStr = str.trim().replace(/^\(*/, '').replace(/\)*$/, '');
            let geoms = [];
            let depth = 0;
            let start = 0;
            for (let i = 0; i < cleanedStr.length; i++) {
                if (cleanedStr[i] === '(') {
                    if (depth === 0) start = i;
                    depth++;
                } else if (cleanedStr[i] === ')') {
                    depth--;
                    if (depth === 0) {
                        const geomStr = cleanedStr.slice(start, i+1);
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
        }
    };

    return GeoWKTer;
})();
