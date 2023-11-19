class TokenCounter {
    constructor() {
        this.tokenSum = 0
        this.contextLimit = Infinity // Initialize token sum


        
        this.backend_model = null
        this.ts_total_request_ms = null
        this.mean = null
        this.max = null
        this.min = null
        this.last_request = null
        this.token_latency = null
        this.bin = null
    }

    // Adds tokens to the sum
    addTokens(count) {
        this.tokenSum += count;
    }

    setModel() {
        const element = document.getElementsByClassName('text-token-text-secondary');
        if (!element) return "";
        if (element.text == "4"){
            this.contextLimit = 8192;
        } else {
            this.contextLimit = 4096;
        }
    }
    async update_meta() {
        try {
            const response = await fetch('http://localhost:1133/retrieve');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json(); // Parse the JSON response
    
            // Access the properties in a more organized way
            const jsonData = JSON.parse(data.data);
            console.log(jsonData);
        
            this.count_tokens = jsonData.count_tokens;
            this.ts_total_request_ms = jsonData.ts_total_request_ms;
            this.backend_model = jsonData.model;
            this.mean = jsonData.ts_mean_token_without_first_ms;
            this.max = jsonData.ts_max_token_time_ms;
            this.min = jsonData.ts_min_token_time_ms;
            console.log(this.count_tokens)
            console.log(this.ts_total_request_ms)
            console.log(this.backend_model)
            console.log(this.mean)
            console.log(this.max)
            console.log(this.min)

        } catch (error) {
            console.error('Error:', error);
        }
    }
    

    getContextLimit() {
        this.contextLimit;
    }

    // Resets the token count to zero
    resetTokenCount() {
        this.tokenSum = 0;
    }

    // Returns the current sum of tokens
    getSum() {
        return this.tokenSum;
    }

    // Counts tokens from a given text
    async countTokens(text) {
        const url = "http://localhost:1133/get_token_count";
        const formData = new URLSearchParams();
        formData.append('data', text);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/x-www-form-urlencoded'
                        },
                body: formData,
                mode: 'cors',

            })
            
            const data = await response.json()
            return parseInt(data);

        }
        catch (error) {
            console.error('Error:', error);
            return 0;
        
        };
    }

    async getPasteBin(text) {
        const url = "http://localhost:1133/update_window_bin";
        const formData = new URLSearchParams();
        formData.append('data', text);
        formData.append('size', this.getContextLimit());
    
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/x-www-form-urlencoded'
            },
            body: formData,
            mode: 'cors',
        });
    
        return res.text();
    }

    // Updates the token counts
    async updateCounts() {
        const text = this.getText();
        const tokenCount = await this.countTokens(text);
        this.createOrUpdateTokenCountElement(tokenCount);
        this.addTokens(tokenCount);
    }

    // Gets text from a specified element
    getText() {
        const element = document.querySelector('.flex.flex-col.text-sm.gizmo\\:pb-9.dark\\:bg-gray-800.gizmo\\:dark\\:bg-transparent');
        if (!element) return "";

        const userDivs = element.querySelectorAll('div[data-message-author-role="user"]');
        const assistantDivs = element.querySelectorAll('div[data-message-author-role="assistant"]');
        // console.log(userDivs[0].innerText)
        // console.log(assistantDivs[0].innerText)
        // console.log(userDivs[1].innerText)
        // console.log(assistantDivs[1].innerText)
        // console.log(userDivs[2].innerText)
        // console.log(assistantDivs.innerText)

        let count = 0;
        let res = "";
        while (count < userDivs.length && count < assistantDivs.length) {
            res += userDivs[count].innerText + ' ' + assistantDivs[count].innerText + ' ';
            count++;
        } 
        while (count < userDivs.length){
            res += userDivs[count].innerText + ' '
        }
        while (count < assistantDivs.length){
            res += assistantDivs[count].innerText + ' ';
            count++;
        }

        //[...userDivs, ...assistantDivs].map(el => el.innerText).join(' ');

        return res
    }

    // Creates or updates the token count element on the page
    async createOrUpdateTokenCountElement(tokenCount) {
        await this.update_meta()
        let tokenCountElement = document.getElementById("token-count");
        if (!tokenCountElement) {

            tokenCountElement = document.createElement("div");
            this.setupTokenCountElement(tokenCountElement);
            document.body.appendChild(tokenCountElement);
        }
        
        if (tokenCount < this.contextLimit){
            this.styleTokenCountElement(tokenCountElement);
            tokenCountElement.innerText = `${Math.round(this.contextLimit - tokenCount)} tokens left in context window`;
        } else{
            this.styleTokenCountElement(tokenCountElement);
            let bin = await this.getPasteBin(this.getText())
            this.bin = bin
            tokenCountElement.innerText = 'context window full'
        }
        console.log(this.count_tokens)
        console.log(this.ts_total_request_ms)
        console.log(this.backend_model)
        console.log(this.mean)
        console.log(this.max)
        console.log(this.min)
        
        // ========== grid of request stats ========== 

        // Create the container for the grid
        let gridContainer = document.createElement("div");
        gridContainer.style.display = "grid";
        gridContainer.style.gridTemplateColumns = "1fr 1fr"; // Two columns with equal width
        gridContainer.style.columnGap = "10px";
        gridContainer.style.rowGap = "5px";
        gridContainer.style.fontSize = "12px";

    
        // 'data' refers to the endpoint with the json object of request information ('r')
        const backendModel = this.backend_model
        const lastRequest = { count_tokens: this.count_tokens, ts_total_request_ms: this.ts_total_request_ms }
         // { data.count_tokens, data.ts_total_request_ms }

        const lostContextText = this.bin; // this comes from the other endpoint with the text content

        const tokenLatency = { min: this.min, mean: this.mean, max: this.max }
    
        // data.something (I forget what the object names are, console log to find it)
        // END TODO
        // Create and add the first div
        let div1 = document.createElement("div");
        div1.innerHTML = `<strong>Backend model</strong><br>${backendModel}`;
        gridContainer.appendChild(div1);

        // Create and add the second div
        let div2 = document.createElement("div");
        div2.innerHTML = `<strong>Last Request</strong><br>${lastRequest.count_tokens.toFixed(3)} tokens, ${lastRequest.ts_total_request_ms.toFixed(3)}ms`;
        gridContainer.appendChild(div2);

        // Create and add the third div (spanning two columns)
        let div3 = document.createElement("div");
        div3.style.gridColumn = "span 2"; // Span two columns

        // Create a parent title for the third div
        let parentTitle = document.createElement("strong");
        parentTitle.innerText = "Token latency";

        // Create a flex container div for the content divs
        let contentContainer = document.createElement("div");
        contentContainer.style.display = "flex"; // Use flexbox for horizontal layout
        contentContainer.style.gap = "10px"; // Use flexbox for horizontal layout

        // Create content divs with subtitle and content
        let contentDiv1 = document.createElement("div");
        contentDiv1.innerHTML = `<strong>min</strong><br>${tokenLatency.min.toFixed(3)}ms`;

        let contentDiv2 = document.createElement("div");
        contentDiv2.innerHTML = `<strong>mean</strong><br>${tokenLatency.mean.toFixed(3)}ms`;

        let contentDiv3 = document.createElement("div");
        contentDiv3.innerHTML = `<strong>max</strong><br>${tokenLatency.max.toFixed(3)}ms`;

        // Append content divs to the third div
        div3.appendChild(parentTitle);

        // Append the content divs to the flex container
        contentContainer.appendChild(contentDiv1);
        contentContainer.appendChild(contentDiv2);
        contentContainer.appendChild(contentDiv3);

        // Append the flex container to the third div
        div3.appendChild(contentContainer);

        // Append the third div to the gridContainer
        gridContainer.appendChild(div3);

        // Append the grid container to the tokenCountElement
        tokenCountElement.appendChild(gridContainer);


        // ====== X tokens in chat element ========
        let tokenCountDiv = document.createElement("div");
        tokenCountDiv.innerHTML = `<strong>${Math.round(tokenCount)} tokens in chat</strong>`;
        tokenCountDiv.style.fontSize = "14px"
        tokenCountDiv.style.paddingTop = "10px"

        tokenCountElement.appendChild(tokenCountDiv)

        // ======= lost context element ========= 

        // Create the "Lost Context" element
        let lostContextElement = document.createElement("div");

        let titleContainer = document.createElement("div");
        titleContainer.style.display = "flex";
        titleContainer.style.alignItems = "center"; // Vertically center-align items
        titleContainer.style.gap = "10px";

        // Create a div for the "Lost Context" title
        let titleElement = document.createElement("div");
        titleElement.style.fontSize = "12px"
        titleElement.innerHTML = '<strong>Lost context</strong>';

        // Create a div for the "Copied!" text (initially hidden)
        let copiedTextElement = document.createElement("div");

        copiedTextElement.innerHTML = 'Copied!';
        copiedTextElement.style.display = "none"; // Initially hidden
        copiedTextElement.style.fontSize = "12px"; // Initially hidden
        copiedTextElement.style.marginTop = "auto"; // Vertically align to the bottom

        titleContainer.appendChild(titleElement);
        titleContainer.appendChild(copiedTextElement);

        // Add the title container above the gray box
        lostContextElement.appendChild(titleContainer);


        // Create a div for the text content (clickable)
        let contentElement = document.createElement("div");
        contentElement.style.cursor = "pointer";
        contentElement.style.backgroundColor = "#27AE60";
        contentElement.style.overflow = "hidden"; // Hide overflow
        contentElement.style.fontSize = "12px";
        contentElement.style.maxHeight = "6em"; // Limit max height for scroll
        contentElement.style.padding = "4px";
        contentElement.style.marginTop = ".25em"
        contentElement.style.borderRadius = "5px";
        contentElement.style.whiteSpace = "pre-line"; // Preserve line breaks
        contentElement.style.overflowY = "auto"; // Enable vertical scrollbar
        contentElement.style.cursor = "pointer";
        contentElement.onclick = copyText; // Trigger copyText function when clicked
        contentElement.innerHTML = `<p>${lostContextText}</p>`;


        lostContextElement.appendChild(contentElement);
        tokenCountElement.appendChild(lostContextElement);

        function copyText() {
            let textToCopy = lostContextText.trim(); // Remove leading/trailing whitespace
            let tempInput = document.createElement("textarea");
            document.body.appendChild(tempInput);
            tempInput.value = textToCopy;
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);

            // Show the "Copied!" text for a brief moment
            copiedTextElement.style.display = "block";
            setTimeout(() => {
                copiedTextElement.style.display = "none";
            }, 500); // Hide after .5 seconds
        }}

        setupTokenCountElement(element) {
            element.id = "token-count";
            element.style.position = "fixed";
            element.style.top = "12px";
            element.style.right = "20px";
            element.style.padding = "10px";
            element.style.borderRadius = "5px";
            element.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
            element.style.zIndex = "9999";
            element.style.maxWidth = "300px"; // Add max width of 500px
        }
    
        styleTokenCountElement(element) {
            const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
            element.style.backgroundColor = isDarkMode ? "black" : "white";
            element.style.color = isDarkMode ? "white" : "black";
        }
    }
    
    // Creating and using the instance of TokenCounter
    const tokenCounter = new TokenCounter();
    
    // Event listener for DOM content loaded
    document.addEventListener("DOMContentLoaded", () => {
        tokenCounter.setModel()
        tokenCounter.updateCounts();
    });
    
    // Function to check for main content changes
    let previousMainContent = '';
    async function checkForMainContentChanges() {
        const mainElement = document.querySelector('.flex.flex-col.text-sm.gizmo\\:pb-9.dark\\:bg-gray-800.gizmo\\:dark\\:bg-transparent');
        if (!mainElement) return;
        tokenCounter.setModel()
        const currentMainContent = mainElement.textContent;
        if (previousMainContent !== currentMainContent) {
            previousMainContent = currentMainContent;
            tokenCounter.updateCounts();
            await tokenCounter.update_meta()
        }
    }
    
    setInterval(checkForMainContentChanges, 500);