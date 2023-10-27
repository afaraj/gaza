import './style.css';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import Feature from 'ol/Feature.js';
import Geolocation from 'ol/Geolocation.js';
import Map from 'ol/Map.js';
import Point from 'ol/geom/Point.js';
import View from 'ol/View.js';
import {
  Select,
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import Gaza from './gaza.json';


let isLocationSet = false;
let currentLatLong = [0, 0];
let gazaVectorLayer = null;

/**
 * Function that rotates a point around another point by a given angle in degrees.
 * @param {number[]} point The point to rotate.
 * @param {number[]} center The center point to rotate around.
 * @param {number} angle The angle in degrees.
 * @return {number[]} The rotated point.
 */ 
function rotatePoint(point, center, angle) {
  const angleInRadians = angle * (Math.PI / 180);
  const cos = Math.cos(angleInRadians);
  const sin = Math.sin(angleInRadians);
  const rotatedX = cos * (point[0] - center[0]) - sin * (point[1] - center[1]) + center[0];
  const rotatedY = sin * (point[0] - center[0]) + cos * (point[1] - center[1]) + center[1];
  return [rotatedX, rotatedY];
}

/**
 * Function that calculates the center of a polygon given an array of coordinates.
 * @param {number[][]} coordinates The array of coordinates.
 * @return {number[]} The center coordinates.
 */
function getCenter(coordinates) {
  let x = 0;
  let y = 0;
  coordinates.forEach((coordinate) => {
    x += coordinate[0];
    y += coordinate[1];
  });
  return [x / coordinates.length, y / coordinates.length];
}

let view = new View({
  center: [0, 0],
  zoom: 2
});


const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});
geolocation.setTracking(true);

const polygonStyle = new Style({
  stroke: new Stroke({
    color: 'red',
    lineDash: [4],
    width: 5,
  }),
  fill: new Fill({
    color: 'rgba(0, 0, 255, 1.0)',
  }),
});


let gazaFeature;

const select = new Select();
const translate = new Translate({
  features: select.getFeatures(),
});


var map = new Map({
  target: 'map',
  interactions: defaultInteractions().extend([select, translate]),
  layers: [
      new TileLayer({
          source: new OSM()
      })
  ],
  view: new View({
      center: fromLonLat([0,0]),
      zoom: 1,
      projection: 'EPSG:3857'
  })
});

function el(id) {
  return document.getElementById(id);
}


const accuracyFeature = new Feature();
geolocation.on('change:accuracyGeometry', function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

const positionFeature = new Feature();
positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#3399CC',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    }),
  })
);

el('turnright').addEventListener('pointerdown', function () {
  const centroid = getCenter(Gaza.geometry.coordinates[0]);
  Gaza.geometry.coordinates[0] = Gaza.geometry.coordinates[0].map((coordinate) => {
    return rotatePoint(coordinate, centroid, -5);
  });

  gazaFeature = (new GeoJSON({
    featureProjection: 'EPSG:3857'
  })).readFeatures(Gaza);

  map.removeLayer(gazaVectorLayer);

  gazaVectorLayer = new VectorLayer({
    source: new VectorSource({
      features: gazaFeature
    }),
    style: new Style({
      stroke: new Stroke({
        color: 'rgba(29, 130, 29, 1)',
        width: 2
      }),
      fill: new Fill({
        color: 'rgba(0, 255, 0, 0.45)'
      })
    })
  });

  
  map.addLayer(gazaVectorLayer);
});


el('turnleft').addEventListener('mousedown', function () {
  const centroid = getCenter(Gaza.geometry.coordinates[0]);
  Gaza.geometry.coordinates[0] = Gaza.geometry.coordinates[0].map((coordinate) => {
    return rotatePoint(coordinate, centroid, 5);
  });

  gazaFeature = (new GeoJSON({
    featureProjection: 'EPSG:3857'
  })).readFeatures(Gaza);

  map.removeLayer(gazaVectorLayer);

  gazaVectorLayer = new VectorLayer({
    source: new VectorSource({
      features: gazaFeature
    }),
    style: new Style({
      stroke: new Stroke({
        color: 'rgba(29, 130, 29, 1)',
        width: 2
      }),
      fill: new Fill({
        color: 'rgba(0, 255, 0, 0.45)'
      })
    })
  });

  
  map.addLayer(gazaVectorLayer);
});


// update the HTML page when the position changes.
geolocation.on('change', function () {
  if (!isLocationSet) {
    // Create a new View with the same center and rotation as the geolocation
    // Positioning the center on the geolocation coordinates
    const currentLocation = geolocation.getPosition();
    currentLatLong = toLonLat(currentLocation);
    
    const centroid = getCenter(Gaza.geometry.coordinates[0]);
    const degreesToRotateBy = Math.random() * 360;
    Gaza.geometry.coordinates[0] = Gaza.geometry.coordinates[0].map((coordinate) => {
      return rotatePoint(coordinate, centroid, degreesToRotateBy);
    });

    // calculate transformation vector between currentLatLong and centerOfGaza
    const centerOfGaza = [34.379618283536985, 31.428995796219397];
    const deltaX = currentLatLong[0] - centerOfGaza[0];
    const deltaY = currentLatLong[1] - centerOfGaza[1];
    const transformationVector = [deltaX, deltaY];
    Gaza.geometry.coordinates[0].forEach((coordinate) => {
      // coordinate = rotatePoint(coordinate, centerOfGaza, 90);
      coordinate[0] += transformationVector[0];
      coordinate[1] += transformationVector[1];
      // coordinate = rotatePoint(coordinate, currentLatLong, 90);
    });

    gazaFeature = (new GeoJSON({
      featureProjection: 'EPSG:3857'
    })).readFeatures(Gaza);

    const turfLine = new GeoJSON().writeFeatureObject(gazaFeature[0]);


    gazaVectorLayer = new VectorLayer({
      source: new VectorSource({
        features: gazaFeature
      }),
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(29, 130, 29, 1)',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(0, 255, 0, 0.45)'
        })
      })
    });

    map.addLayer(gazaVectorLayer);
    

    view = new View({
      center: currentLocation,
      zoom: 10,
    });
    map.setView(view);
    isLocationSet = true;
  }
});

// handle geolocation error.
geolocation.on('error', function (error) {
  const info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});

geolocation.on('change:position', function () {
  const coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
});
