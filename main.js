import './style.css';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import Feature from 'ol/Feature.js';
import Geolocation from 'ol/Geolocation.js';
import Map from 'ol/Map.js';
import Point from 'ol/geom/Point.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import Gaza from './gaza.json';


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


var map = new Map({
  target: 'map',
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


let isLocationSet = false;

// update the HTML page when the position changes.
geolocation.on('change', function () {
  if (!isLocationSet) {
    // Create a new View with the same center and rotation as the geolocation
    // Positioning the center on the geolocation coordinates
    const currentLocation = geolocation.getPosition();
    const currentLatLong = toLonLat(currentLocation);
    console.log(currentLatLong);

    // calculate transformation vector between currentLatLong and centerOfGaza
    const centerOfGaza = [34.379618283536985, 31.428995796219397];
    const deltaX = currentLatLong[0] - centerOfGaza[0];
    const deltaY = currentLatLong[1] - centerOfGaza[1];
    const transformationVector = [deltaX, deltaY];
    Gaza.geometry.coordinates[0].forEach((coordinate) => {
      coordinate[0] += transformationVector[0];
      coordinate[1] += transformationVector[1];
    });

    gazaFeature = (new GeoJSON({
      featureProjection: 'EPSG:3857'
    })).readFeatures(Gaza);

    const gazaVectorLayer = new VectorLayer({
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
      zoom: 11,
    });
    map.setView(view);

    el('accuracy').innerText = geolocation.getAccuracy().toString() + ' [m]';
    el('latitude').innerText = currentLatLong[0].toString() + ' [rad]';
    el('longitude').innerText = currentLatLong[1].toString() + ' [rad]';
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
