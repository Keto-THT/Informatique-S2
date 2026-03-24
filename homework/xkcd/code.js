const XKCD = "https://xkcd.now.sh/?comic="

document.addEventListener("DOMContentLoaded", () => {
    
    const numEl = document.querySelector("#num")
    const btnReset = document.querySelector("#reset")
    const img = document.querySelector("#xkcd img")
    const btnNext = document.querySelector("#next")
    const btnPrev= document.querySelector("#previous")

    let currentNum = null

    const fetchIssue = async (num) => {
        const url = XKCD + num
        const response = await fetch(url)
        const data = await response.json()
        
        currentNum = data.num
        numEl.textContent = data.num
        img.src = data.img 
    
    }
    const next = () => fetchIssue(currentNum + 1)
    const previous = () => fetchIssue(currentNum - 1)


    btnReset.addEventListener("click", () => fetchIssue("latest"))
    btnPrev.addEventListener("click", previous)
    btnNext.addEventListener("click", next)

    fetchIssue("latest")

})



