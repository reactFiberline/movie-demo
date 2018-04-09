# movie-demo 
This is a version of [this movie demo](https://codesandbox.io/s/5zk7x551vk) that lets you inspect some of the fiber operations that are happening under the hood.  Fiber is *intense*, it is complicated and has a lot of nuance to it. This tool is a great way to start understanding how things will work with the new architecture!

## Getting Started
Watch [react-fiberline](https://github.com/reactFiberline/react-fiberline) to get updates on improvements to fiberline.
### Step 1
Install the Fiberline Chrome extension -- [found here](www.google.com)
### Step 2
Setup the Website

1. `git clone https://github.com/reactFiberline/movie-demo.git`
2. No need to install dependencies (which is why it's so big)
3. `cd movie-demo`
4. `npm start`

### Step 3
Inspect the website, it will run on `localhost:3000`

Check out the Fiberline Tab
![fiberline pic](https://github.com/reactFiberline/react-fiberline/blob/master/chart.jpg)

#### Use the console tab to display an object with the chronological events of Fiber.
1. Open the console in your browser
2. `fiberData.fiberlineEvents` will 
![console pic](https://github.com/reactFiberline/react-fiberline/blob/master/console.jpg)

