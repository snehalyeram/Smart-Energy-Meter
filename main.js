// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyQcq1bsee6zqRfYJin2OOSjvbafSooG4",
  authDomain: "energy-meter-7359f.firebaseapp.com",
  databaseURL: "https://energy-meter-7359f-default-rtdb.firebaseio.com",
  projectId: "energy-meter-7359f",
  storageBucket: "energy-meter-7359f.firebasestorage.app",
  messagingSenderId: "532869669680",
  appId: "1:532869669680:web:a9636134f729fdd64a9ef5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to the Realtime Database
const database = firebase.database();

// Reference to the sensor data and chart data
const sensorRef = database.ref('sensorData/');
const chartDataRef = database.ref('chartData/');

// Select the button
const toggleButton = document.getElementById('toggleButton');

// Create a variable to track the toggle state (0 or 1)
let toggleState = 0;

// Function to write to Firebase
function writeToFirebase(value) {
    firebase.database().ref('toggleState').set({
        state: value
    });
}

// Event listener for button click
// Event listener for button click
toggleButton.addEventListener('click', () => {
  // Ask for confirmation before toggling
  const confirmToggle = confirm('Are you sure you want to Reset the Energy?');
  
  if (confirmToggle) {
      // Toggle between 0 and 1
      toggleState = toggleState === 0 ? 1 : 0;

      // Write the new state to Firebase
      writeToFirebase(toggleState);

      // Update button text to reflect current state
      toggleButton.innerText = toggleState === 0 ? 'Energy Reset' : 'Energy Reset';
  } else {
      // User canceled the toggle action
      console.log('Toggle canceled by the user.');
  }
});


// Initialize button text
toggleButton.innerText = 'Energy Reset';

// Chart setup
let dataPoints = [];
let chart = new CanvasJS.Chart("chartContainer", {
  theme: "light2",
  title: {
    text: "Live Energy Data"
  },
  data: [{
    type: "line",
    dataPoints: dataPoints
  }]
});

// Function to check if a date is today
function isToday(date) {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// Function to update chart data in Firebase
function saveChartData() {
  chartDataRef.set(dataPoints.map(point => ({
    x: point.x.getTime(),  // Save timestamps
    y: point.y
  })));
}

// Fetch and initialize the chart with saved data from today only
chartDataRef.once('value', (snapshot) => {
  const savedData = snapshot.val();
  if (savedData) {
    savedData.forEach(point => {
      const pointDate = new Date(point.x);
      if (isToday(pointDate)) {
        dataPoints.push({
          x: pointDate,  // Convert timestamp back to Date object
          y: point.y
        });
      }
    });
    chart.render();  // Render the chart with the filtered data
  }
});

// Real-time Firebase data fetching and chart update for current day only
sensorRef.on('value', (snapshot) => {
  const data = snapshot.val(); // Get the data object from Firebase

  if (data) {
    // Update the values on the web page
    document.getElementById('voltage').innerText = data.voltage || '--';
    document.getElementById('current').innerText = data.current || '--';
    document.getElementById('power').innerText = data.power || '--';
    document.getElementById('energy').innerText = data.energy || '--';
    document.getElementById('freq').innerText = data.frequency || '--';
    document.getElementById('pf').innerText = data.pf || '--';
    
    // Update chart data points for energy
    const xValue = new Date();  // Use the current timestamp for x-axis
    const yValue = parseFloat(data.energy) || 0;  // Using energy for y-axis data

    // Only add data points if the date is today
    if (isToday(xValue)) {
      // Add new data point to the chart
      dataPoints.push({ x: xValue, y: yValue });

      // Limit the number of data points to avoid overcrowding the chart
      if (dataPoints.length > 500) {
        dataPoints.shift();
      }

      // Re-render the chart with updated data
      chart.render();

      // Save the updated chart data to Firebase
      saveChartData();
    }
  } else {
    console.log('No data available');
  }
});
