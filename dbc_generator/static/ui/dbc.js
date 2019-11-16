let schema;
let inputs = [];

window.onload = function() {
    fetch("/static/ui/schema.json")
    .then(response => response.json())
    .then(response => {
        schema = response;
        this.createFields(schema.file, inputs, document.getElementById("fields"));
        
    });

    fetch("/dbcs")
    .then(response => response.json())
    .then(response => {
        let select = this.document.getElementById("select-dbc");
        for(let file of response) {
            let option = document.createElement("option");
            option.text = file.name;
            option.value = file.download;
            select.appendChild(option);
        }
    });
    // let fields = document.getElementById("fields");
    // console.log(getDataFromContainer(fields));
}

/**
 * Creates the fields for the schema object
 * @param {Object} fieldList 
 * @param {HTMLInputElement[]} inputList 
 * @param {HTMLDivElement} parentContainer 
 */
function createFields(fieldList, inputList, parentContainer) {
    let container = document.createElement("div");
    container.classList.add("container");
    let inputFields = [];
    for(let field of fieldList) {
        if(field.ref == undefined) {
            // create text input field
            let defaultText = field.default != undefined ? field.default : "";
            let textField = textInput(field.name, field.display, defaultText);
            inputFields.push(textField);
            container.appendChild(textField);
        } else {
            let button = document.createElement("button");
            button.innerHTML = field.display;
            button.onclick = () => {
                let subInputs = [];
                createFields(schema[field.ref], subInputs, container);
                inputFields.push(subInputs[0]);
            }
            container.appendChild(button);
        }
    }
    inputList.push(inputFields);
    parentContainer.appendChild(container);
}
/**
 * Creates a text input field
 * @param {string} id
 * @param {string} placeholder 
 * @param {string?} value 
 * @returns The text field DOM element
 */
function textInput(id, placeholder, value = "") {
    let input = document.createElement("input");
    input.type = "text";
    input.name = id;
    input.id = id;
    input.placeholder = placeholder;
    input.value = value;
    input.classList.add("text-input");
    return input;
}

/**
 * Sends data to the backend
 */
function post() {
    // let data = {file: []};
    // for(let packet of inputs[0]) {
    //     let packetData = {signals: []};
    //     for(let value of packet) {
    //         if(value instanceof Array) {
    //             let signalData = {};
    //             for(let j = 0; j < schema.signals.length; j++) {
    //                 signalData[schema.signals[j].name] = value[j].value;
    //             }
    //             packetData.signals.push(signalData);
    //         } else {
    //             packetData[value.name] = value.value;
    //         }
    //     }
    //     data.file.push(packetData);
    // }
    let data = extractData();

    fetch("upload", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(response => response.text()).then(console.log);
}

/**
 * Imports data into fields from a JSON response
 * @param {Object} data 
 * @param {string} key 
 * @param {HTMLDivElement} parentContainer 
 */
function importFields(data, key, parentContainer) {
    let schemaData = schema[key];

    for(let entry of data) {
        let container = document.createElement("div");
        container.classList.add("container");
        container.id = key;

        for(let field of schemaData) {
            if(field.ref == undefined) {
                // create text input field
                let defaultText = entry[field.name];
                let textField = textInput(field.name, field.display, defaultText);
                // inputFields.push(textField);
                container.appendChild(textField);
            } else {
                let button = document.createElement("button");
                button.innerHTML = field.display;
                button.onclick = () => {
                    let subInputs = [];
                    createFields(schema[field.ref], subInputs, container);
                    inputFields.push(subInputs[0]);
                }
                container.appendChild(button);

                importFields(entry[field.ref], field.ref, container);
            }
        }
        parentContainer.appendChild(container);
    }
}

function extractData() {
    let fields = document.getElementById("fields");
    return getDataFromContainer(fields)[""][0];
}

function getDataFromContainer(container) {
    let data = {};
    for(let element of container.children) {
        if(element instanceof HTMLDivElement) {
            if(!data[element.id]) {
                data[element.id] = [];
            }
            data[element.id].push(getDataFromContainer(element));
        } else if(element instanceof HTMLInputElement) {
            // console.log(element.name)
            data[element.name] = element.value;
        }
    }
    return data;
}

/**
 * Loads the selected DBC file from github
 */
async function loadSelectedFile() {
    let selector = document.getElementById("select-dbc");
    let url = selector.options[selector.selectedIndex].value;
    if(url == "null") {
        return;
    }
    console.log(url);
    let response = await fetch("/parse", {
        method: "POST",
        body: url
    });
    let data = await response.json();
    let container = document.createElement("div");
    container.classList.add("container");
    importFields(data.file, "file", container);
    let parentContainer = document.getElementById("fields");
    parentContainer.innerHTML = "";
    parentContainer.appendChild(container);
}