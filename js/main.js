var fsApp = angular.module('flightSearchApp', ["720kb.datepicker"]);

fsApp.module('flightSearchApp').filter('price_format', function() {
  return function(price) {
  	var out = "";
	var out = price.replace("CAD", "$");
    return out;
  };
})

fsApp.module('flightSearchApp').filter('date_format', function() {
  return function(datetime) {
  	var out = "";
	var out = datetime.replace("T", " at ");
    return out;
  };
})

fsApp.module('flightSearchApp').controller('flightSearchCtrl', function ($scope, $http) {

	// constants for setup
	$scope.QPX_url = "https://www.googleapis.com/qpxExpress/v1/trips/search?key=AIzaSyDEe8vSJJozjtPLa5Q5UXBd6IPLh8u00OI";
	$scope.QPX_request = {
	  "request": {
	    "slice": [
	      {
	        "origin": "YYZ",
	        "destination": "GRU",
	        "date": "2017-10-10"
	      }
	    ],
	    "passengers": {
	      "adultCount": 1,
	      "infantInLapCount": 0,
	      "infantInSeatCount": 0,
	      "childCount": 0,
	      "seniorCount": 0
	    },
	    "solutions": 8,
	    "refundable": false
	  }
	}

	// To be used by the application
	$scope.searchParams;
	$scope.departFlightResults = [];
	$scope.returnFlightResults = [];
	$scope.loadingInProgress = false;
	$scope.resultsAvailable = false;

	// Excute the search 2x, one for departure date and one for 
	// return date, I may have missed something on the API docs
	// but the QPX api does not seem to accept a return date option.
	$scope.startSearch = function() {
		searchFlights();
		searchFlights(true);
	};

	function searchFlights(isReturnFlight) {

		// get the current request info based on user input
	    var currentRequest = {
		  "request": {
		    "slice": [
		      {
		        "origin": isReturnFlight ? $scope.searchParams.returnCode : $scope.searchParams.departureCode,
		        "destination": isReturnFlight ? $scope.searchParams.departureCode : $scope.searchParams.returnCode,
		        "date": isReturnFlight ? $scope.searchParams.returnDate : $scope.searchParams.departureDate,
		      }
		    ],
		    "passengers": {
		      "adultCount": $scope.searchParams.adults,
		      "infantInSeatCount": $scope.searchParams.infants,
		      "childCount": $scope.searchParams.children
		    },
		  }
		}

		// merge (deep copy) with static example object
		var postData = angular.merge({}, $scope.QPX_request, currentRequest);

		$scope.loadingInProgress = true;

		// POST to the API
		$http({
		    method : "POST",
		    url : $scope.QPX_url,
		    data: postData
		}).then(function mySuccess(response) {
		    renderResults(response.data, isReturnFlight);
		}, function myError(response) {
			alert("There was an error, the developer was too lazy to create error handlers, please check the console.");
		    console.log(response);
		}).then(function() {
			console.log("complete");
			$scope.loadingInProgress = false;
			$scope.resultsAvailable = true;
		});

	}

	function renderResults(data, isReturnFlight) {

		for (var i = 0; i < data.trips.tripOption.length; i++) {

			// Create a display data object that will hold the data
			// to be displayed to end user.
			var displayData = {
				totalPrice : 0,
				totallegs : 0,
				legsInfo: [],
			};

			// Shorthands for loop
			var tripOption = data.trips.tripOption[i];
			var segments   = tripOption.slice[0].segment;

			// Fill the displayData with simplified data
			displayData.totalPrice = tripOption.saleTotal;
			displayData.totallegs  = tripOption.slice[0].segment.length;
			for (var s = 0; s < segments.length; s++) {
				displayData.legsInfo.push({ 
					carrier: 		segments[s].flight.carrier,
					number: 		segments[s].flight.number, 	
					arrivalTime : 	segments[s].leg[0].arrivalTime,
					departureTime : segments[s].leg[0].departureTime,
					destination : 	segments[s].leg[0].destination,
					duration : 		segments[s].leg[0].duration,
					meal : 			segments[s].leg[0].meal,
					origin : 		segments[s].leg[0].origin
				});
			}

			// populate the proper array
			if (isReturnFlight) {
				$scope.returnFlightResults.push(displayData);
			} else {
				$scope.departFlightResults.push(displayData);
			}
		}

	}

});







