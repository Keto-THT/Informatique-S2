// using vite, we can write our code with URLs that simply read
// /api/v2/xxx
// and vite will proxy them to whichever server is configured in vite.config.js,
// which is currently set to https://pixels-war.fly.dev
// so there's essentially no need for a global variable with the server URL..

// also note that it's probably wise to start with the TEST map

document.addEventListener("DOMContentLoaded",
    async () => {

        let MAP_ID = "TEST"
        let API_KEY = undefined
        let NI = 0 
        let NJ = 0 

        // for starters we get the list of maps from the server
        // and use that to populate the mapid input
        // so we don't have to guess the map ids

        console.log("Retrieving maps from the server...")
        const maps_response = await fetch(`/api/v2/maps`, {credentials: "include"})
        const maps_json = await maps_response.json()

        //SPOILER:
        // test for the response status code, and if not 2xx,
        // use alert() to display an ehopefully meaningful error
        if (!maps_response.ok) {
            alert(`Error retrieving maps: ${maps_response.status} ${maps_response.statusText}`)
            return
        }

        //SPOILER:
        // when the response is good, use the resulting JSON
        // to populate the dropdown in HTML,
        // so the user picks among actually available maps
        const select = document.getElementById("mapid-input")
        for (const {name, timeout} of maps_json) {
            const option = document.createElement("option")
            option.value = name
            const seconds = timeout / 1000000000
            option.textContent = `${name} (${seconds}s)`
            select.appendChild(option)
            console.log(`Map ${name} added to the dropdown`)
        }

        //TODO:
        // write the connect(..) function below,
        async function connect(event) {
            // retrieves the selected map id (from the dropdown)
            MAP_ID = document.getElementById("mapid-input").value 
            
            // sends the /init request to the server for this map id
            const response = await fetch(`/api/v2/${MAP_ID}/init`, {
                method: 'GET',
                credentials: 'include',
            })

            // - check the response status code as usual
            if (!response.ok){
                alert('Error connecting to map ' + MAP_ID +':'+ response.status + response.statusText)
                return
            }
    

            // - initialize the map when OK
            const json = await response.json()
            API_KEY = json.api_key
            NI = json.ni
            NJ = json.nj
            draw_map(json.ni, json.nj, json.data)
        }

        //TODO: and attach it to the Connect button
        document.getElementById('connect-button').addEventListener('click', connect)

        //TODO:
        // write a function that draws a map inside the griv div
        // - ni is the number of rows,
        // - nj the number of columns,
        // - and data is a 3D array of size ni x nj x 3,
        //   where the last dimension contains the RGB color of each pixel
        // do not forget to clean up any previously drawn map
        // also give the child div's the 'pixel' class to leverage the default css
        // also don't forget to set the gridTemplateColumns of the grid div
        function draw_map(ni, nj, data) {
            const grid = document.getElementById("grid")

            grid.innerHTML = '' // clean any previous maps
            grid.style.gridTemplateColumns = `repeat(${nj}, 1fr)`// setting the gridTemplateColumns
            for (let i = 0; i < ni; i++) {
                for (let j = 0; j < nj; j++) {
                    const div = document.createElement("div")
                    div.classList.add("pixel")
                    const [r, g, b] = data[i][j]
                    div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
                    div.dataset.i = i
                    div.dataset.j = j
                    div.addEventListener("click", set_pixel)
                    grid.appendChild(div)
                }
            }


        }

        //TMP: to test the previous function: 3 lines and 5 columns
/*         draw_map(3, 5, [
            [ [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0] ],
            [ [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0] ],
            [ [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0] ],
        ])
 */
        //TODO:
        // write a function that applies a set of color changes
        // the input is a collection of 5-tuples of the form i, j, r, g, b
        function apply_changes(ni, nj, changes) {
            const grid = document.getElementById("grid")
            for (const [i, j, r, g, b] of changes) {
                const div = grid.children[i * nj + j]
                if (div) div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
            }
        }

        

        //TMP: to test the previous function, let's change the color of 3 pixels
/*         apply_changes(3, 5,[
            [1, 1, 0, 0, 255],
            [1, 2, 0, 0, 255],
            [1, 3, 0, 0, 255],
        ])
 */

        //TODO:
        // now that we have the JSON data that describes the map, we can
        // display the grid, and retrieve the corresponding API-KEY

        

        //TODO:
        // now that we have the API-KEY,
        // write a refresh(...) function that updates the grid
        // and attach this function to the refresh button click
        async function refresh() {
            if (!API_KEY) return
            
            const response = await fetch(`/api/v2/${MAP_ID}/init`, {
                credentials: 'include',
                headers: { 'API-KEY': API_KEY },
            })
            if (!response.ok) return
            const json = await response.json()
            draw_map(NI, NJ, json.data)
        }

        document.getElementById("refresh-button").addEventListener("click", refresh)

        //TODO:
        // to be able to color a pixel: write a set_pixel(...)
        // function that sends a request to the server to color a pixel
        // and attach this function to each pixel in the grid click
        // the color is taken from the color picker (code provided below)
        // it's up to you to find a way to get the pixel coordinates

         async function set_pixel(event) {
            if (!API_KEY) return
            const div = event.currentTarget
            const i = parseInt(div.dataset.i)
            const j = parseInt(div.dataset.j)
            const [r, g, b] = getPickedColorInRGB()

            const response = await fetch(`/api/v2/${MAP_ID}/set`, { 
                method: 'POST',
                credentials: 'include',
                headers: {
                    'API-KEY': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ i, j, r, g, b }),
            })

            if (!response.ok) {
                alert(`Error setting pixel: ${response.status} ${response.statusText}`)
                return
            }

            const wait = await response.json()
            if (wait > 0) {
                alert(`Is still waiting ${(wait / 1_000_000_000).toFixed(1)} seconds !`)
                return
            }

            div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
            await refresh()
        }

        setInterval(refresh, 2000)

        //TODO:
        // why not refresh the grid every 2 seconds?
        // or even refresh the grid after clicking a pixel?

        // ---- cosmetic / convenience / bonus:

        //TODO: for advanced students, make it so we can change maps from the UI
        // using e.g. the Connect button in the HTML

        // TODO: to be efficient, it would be useful to display somewhere
        // the coordinates of the pixel hovered by the mouse

        //TODO: for the quick ones: display somewhere how much time
        // you need to wait before being able to post again

        //TODO: for advanced users: it could be useful to be able to
        // choose the color from a pixel?



        // no need to change anything below
        // just little helper functions for your convenience

        // retrieve RGB color from the color picker
        function getPickedColorInRGB() {
            const colorHexa = document.getElementById("colorpicker").value

            const r = parseInt(colorHexa.substring(1, 3), 16)
            const g = parseInt(colorHexa.substring(3, 5), 16)
            const b = parseInt(colorHexa.substring(5, 7), 16)

            return [r, g, b]
        }

        // in the other direction, to put the color of a pixel in the color picker
        // (the color picker insists on having a color in hexadecimal...)
        function pickColorFrom(div) {
            // rather than taking div.style.backgroundColor
            // whose format we don't necessarily know
            // we use this which returns a 'rgb(r, g, b)'
            const bg = window.getComputedStyle(div).backgroundColor
            // we keep the 3 numbers in an array of strings
            const [r, g, b] = bg.match(/\d+/g)
            // we convert them to hexadecimal
            const rh = parseInt(r).toString(16).padStart(2, '0')
            const gh = parseInt(g).toString(16).padStart(2, '0')
            const bh = parseInt(b).toString(16).padStart(2, '0')
            const hex = `#${rh}${gh}${bh}`
            // we put the color in the color picker
            document.getElementById("colorpicker").value = hex
        }
    }
)
