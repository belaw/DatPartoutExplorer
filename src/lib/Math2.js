/**
 * Created by NO ONE on 02.07.14.
 */
var Math2 = {};

Math2.random = function (min, max) {
    return Math.random() * (max - min) + min;
};

Math2.randomInt = function (min, max) {
    max++;
    return Math.floor(Math.random() * (max - min) + min);
};

Math2.round = function (number, places) {
    places = Math.pow(10, places);
    return Math.round(number * places) / places;
};