"use strict";
// Master of order form, to be cloned
const MASTER_FORM_ID = "1Lab_Wbbug5J9aVg11ZcgGrqTC2vbszjmwuUD_JGxBEU";
// The props constants
const KANISIUS_LAST_FORM_ID = "kanisius-last-form-id";
const KANISIUS_LAST_FORM_URL = "kanisius-last-form-url";
const KANISIUS_FORM_GENERATION_SUCCESS = "kanisius-last-generation-success";
/**
 * The folder of the forms.
 * @param space{string} - ID / space of the forms, e.g.: Kanisius, Gonzaga, etc.
 */
function getOrderFormsFolderId(space = "kanisius") {
    // Note: Could generate for gonzaga, not kanisius.
    if (space == "gonzaga") {
        return "gonzaga-order-form-id";
    }
    else {
        // Kanisius as default
        return "1Iaj3a-Hv0-MUWWpJj9TXWTQU5Zmacwh8";
    }
}
function doGet() {
    return HtmlService.createHtmlOutputFromFile("generator").setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
/**
 * Get the 5 upcoming weekdays, always start with monday.
 * If today is monday, starts with today. If not, it start with the upcoming monday.
 * The day names and month names are in Indonesian.
 */
function getWeekdayDates() {
    const dayNames = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];
    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];
    const dates = [];
    // Get today's date
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let monday;
    // If today is Monday, use today. Otherwise, find the next Monday.
    if (dayOfWeek === 1) {
        monday = today;
    }
    else {
        // Calculate the number of days to add to get to the next Monday
        const daysToAdd = (1 + 7 - dayOfWeek) % 7;
        monday = new Date(today);
        monday.setDate(today.getDate() + daysToAdd);
    }
    // Add Monday to the array
    dates.push(`${dayNames[monday.getDay()]} ${monday.getDate()} ${monthNames[monday.getMonth()]}`);
    // Loop to get Tuesday, Wednesday, Thursday, and Friday
    for (let i = 1; i < 5; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        dates.push(`${dayNames[nextDay.getDay()]} ${nextDay.getDate()} ${monthNames[nextDay.getMonth()]}`);
    }
    return dates;
}
/**
 * Note: This function currently not being used.
 * @param e
 * @returns
 */
function doPost(e) {
    console.log("this is doPost");
    Logger.log("doPost..");
    // e is an object containing the form data
    const menuData = e.parameter.day_menu;
    const priceData = e.parameter.price;
    // Process the data here, e.g., create a Google Form
    Logger.log(menuData);
    Logger.log(priceData);
    // Return a success message or new HTML
    return HtmlService.createHtmlOutput("<h1>Form submitted successfully!</h1>");
}
/**
 * Form submission
 */
function processForm(formData) {
    console.log("ProcessForm..");
    // The folder to save the form
    const folderId = getOrderFormsFolderId();
    // const folder = DriveApp.getFolderById(folderId);
    // Acquire the form data
    const data = {
        days: formData["days[]"],
        menus: formData["menus[]"],
        prices: formData["prices[]"],
    };
    // Create form name and other needed texts
    const { clonedFormName: cloneFormName } = createNames(data);
    // Clone form
    const clonedForm = cloneForm(cloneFormName);
    // Create form content and questions
    createFormDescription(clonedForm, data);
    addQuestions(clonedForm, data);
    // Move upload file to the last questions
    moveUploadFileItem(clonedForm);
    // Restore the upload destination folder
    restoreUploadFileFolder(clonedForm);
    //Set the cloned form publicly accessible
    setTheFormAccessible(clonedForm);
    // Set form settings
    setFormSetting(clonedForm);
    // end of the whole process
    return;
    // const formTitle = "form title 2";
    // const formDesc =
    //   "This is the description. <br /> " + menus[0] + "<br /> " + menus[1];
    // The form id that will be set later. Also will be used to move the file in the 'finally' block
    let formId = "";
    try {
        // Create a form in the ORDER_FORMS_FOLDER with the above title, then add the description
        // console.log("Creating form..");
        // const form = FormApp.create(formTitle);
        // form.setDescription(formDesc);
        // console.log("Finish setting description");
        console.log("Finish set additional settings");
        // Publish the form right away.
        console.log("publishing form..");
        // form.setPublished(true);
        const formUrl = clonedForm.getPublishedUrl();
        formId = clonedForm.getId();
        console.log(`form id is set : ${formId}`);
        // If the from successfuly published:
        // 1. Save the link of the form to script attribute 'kanisius-last-form-url'
        PropertiesService.getScriptProperties().setProperty(KANISIUS_LAST_FORM_URL, formUrl);
        // 2. Save the id of the form to script attribute 'kanisius-last-form-id'
        PropertiesService.getScriptProperties().setProperty(KANISIUS_LAST_FORM_ID, formId);
        // 3. Save the success / failure of the form publication to script attribute 'kanisius-last-form-generation'. The value set to 'true'.
        PropertiesService.getScriptProperties().setProperty(KANISIUS_FORM_GENERATION_SUCCESS, "true");
        // 4. Display 'success' html file.
        return HtmlService.createHtmlOutputFromFile("success");
    }
    catch (error) {
        // Log error
        if (error instanceof Error) {
            console.error(`Failed to generate form: ${error.message}`);
        }
        else {
            console.error(`Unknown error : ${String(error)}`);
        }
        // If the form NOT successfuly published do :
        // 1. Set script attribute 'kanisius-last-form-generation' to 'false'.
        PropertiesService.getScriptProperties().setProperty(KANISIUS_FORM_GENERATION_SUCCESS, "false");
        // 2. Display 'failure' html file
        return HtmlService.createHtmlOutputFromFile("failure");
    }
    finally {
        // If form id is set, move the form file to the destination folder
        if (formId) {
            const destinationFolder = DriveApp.getFolderById(folderId);
            const formFile = DriveApp.getFileById(formId);
            formFile.moveTo(destinationFolder);
        }
    }
}
function cloneForm(clonedFormName) {
    // ID of the 'master' form, containing the upload file feature.
    // const sourceFormId = MASTER_FORM_ID;
    console.log("Starting cloneFormAndModify");
    console.log(`sourceFormId : ${MASTER_FORM_ID}`);
    // Get the source form by its ID
    const sourceForm = FormApp.openById(MASTER_FORM_ID);
    console.log("Success retrieving the source form");
    console.log(`sourceForm : ${sourceForm}`);
    console.log(`sourceForm title :  ${sourceForm.getTitle()}`);
    console.log(`description :  ${sourceForm.getDescription()}`);
    // Create a copy of the source form. This also copies all existing questions.
    const driveClonedFile = copyFile(clonedFormName);
    // Retrieve the cloned form by id
    const clonedForm = FormApp.openById(driveClonedFile.getId());
    // Get all items from the cloned form
    // const items = clonedForm.getItems();
    // Find the file upload item. Assuming there's only one.
    // const fileUploadItem = items.find(
    //   (item) => item.getType() === FormApp.ItemType.FILE_UPLOAD
    // );
    // Remove the file upload item from its original position
    // if (fileUploadItem) {
    //   clonedForm.deleteItem(fileUploadItem.getIndex());
    // }
    // Add a paragraph item
    // clonedForm
    //   .addParagraphTextItem()
    //   .setTitle("Please read this carefully")
    //   .setHelpText("This is a new section for you to provide information.");
    // Moves the first item to be the last item.
    // console.log("Before moveItem");
    // clonedForm.moveItem(0, clonedForm.getItems().length - 1);
    console.log("end of this function");
    return clonedForm;
}
/**
 * Copy master form.
 * Copying file is the only way to have the 'upload file' item in the form, since AppScript API does not provide method to add 'file upload'
 * @return {GoogleAppsScript.Drive.File} the copied form.
 */
function copyFile(clonedFormName) {
    // const sourceFormId = MASTER_FORM_ID;
    // Optional: Replace with the ID of the destination folder
    // If not specified, the copy will be placed in the root of your Drive
    const destinationFolderId = getOrderFormsFolderId();
    const sourceFile = DriveApp.getFileById(MASTER_FORM_ID);
    // Create a new name for the copied form
    const newFormName = clonedFormName;
    let copiedFile = null;
    if (destinationFolderId) {
        const destinationFolder = DriveApp.getFolderById(destinationFolderId);
        copiedFile = sourceFile.makeCopy(newFormName, destinationFolder);
    }
    else {
        copiedFile = sourceFile.makeCopy(newFormName);
    }
    // Throw error if copying process is failed
    if (copiedFile === null) {
        throw new Error("Failed copying file in DriveApp :" +
            newFormName +
            " to " +
            destinationFolderId);
    }
    console.log("Finish copying file");
    return copiedFile;
}
/**
 * Creates a new folder for the uploaded files in the same directory as the form,
 * then assigns that folder to the file upload question.
 *
 * @param {GoogleAppsScript.Forms.Form} form The form object to modify.
 */
function setUploadFolder(form) {
    // Get the form's file ID.
    const formFileId = form.getId();
    // Get the form's file object.
    const formFile = DriveApp.getFileById(formFileId);
    // Get the parent folder of the form.
    const parentFolder = formFile.getParents().next();
    console.log(`parent folder name : ${parentFolder.getDateCreated()}`);
    // Create a new folder for uploads within the parent folder.
    // const uploadFolderName = form.getTitle() + ' (File uploads)';
    const uploadFolderName = "marson upload folder";
    const uploadFolder = parentFolder.createFolder(uploadFolderName);
    // Get the file upload question. This assumes there's only one.
    const items = form.getItems(FormApp.ItemType.FILE_UPLOAD);
    console.log(`number of items in the form: ${items.length}`);
    // FIXME: uncomment and fix block below
    // for (let i = 0; i < items.length; i++) {
    //   console.log(`item type : ${items[i].getType().name()}`);
    //   if (items[i].asFileUploadItem) {
    //     console.log(`item #${items[i]} has 'asFileUploadItem`);
    //   } else {
    //     console.log(`item #${items[i]} has NOT 'asFileUploadItem`);
    //   }
    // }
    if (items.length > 0) {
        // const fileUploadItem = items[0].asFileUploadItem();
        // // Assign the new folder's ID to the file upload question.
        // fileUploadItem.setDestinationFolder(uploadFolder);
    }
}
function createNames(data) {
    console.log("Function not implemented");
    // Get the first and last day
    const { firstDay, lastDay } = getFirstAndLastDay(data);
    return {
        clonedFormName: firstDay,
    };
}
/**
 * Add the opening paragraph
 * @param form
 * @param data
 */
function createFormDescription(form, 
// data: { days: string[]; menus: string[]; prices: string[] }
data) {
    form.setDescription(`
      This is first line\n
      This is second line \n
      \n
      This is third line\n
      `);
}
/**
 * Add the menu questions (radio)
 * @param clonedForm
 * @param data
 */
function addQuestions(clonedForm, data) {
    const { days, menus, prices } = data;
    // Loop the `menus`. On every menus that is not empty, add radio box to the form with options "A", "B", "C", and "D".
    for (let i = 0; i < data.menus.length; i++) {
        if (menus[i] && menus[i].trim() !== "") {
            const item = clonedForm.addMultipleChoiceItem();
            item
                .setTitle(days[i] + " - " + menus[i] + " (Rp " + prices[i] + ")")
                .setChoiceValues(["A", "B", "C", "D"]);
        }
    }
    console.log("Finish adding multiple choices");
    console.log("Function not implemented");
}
function moveUploadFileItem(clonedForm) {
    // Assumed the first item is the upload-file item
    clonedForm.moveItem(0, clonedForm.getItems().length - 1);
}
/**
 * An destination folder is needed is a FormApp's form has a upload-file item.
 * After copied, a DriveApp's file or FormApps's form does not have the upload-file folder.
 * The function is to restore the upload destination folder.
 * @param clonedForm
 */
function restoreUploadFileFolder(clonedForm) {
    console.log("Function not implemented");
}
/**
 * Allow form to be publicly accessible
 * @param clonedForm
 */
function setTheFormAccessible(clonedForm) {
    console.log("Function not implemented");
}
/**
 * Set form settings
 * @param clonedForm
 */
function setFormSetting(clonedForm) {
    // Form settings:
    clonedForm
        .setCollectEmail(true)
        // .setRequireLogin(true) // Required for file upload
        .setAllowResponseEdits(false)
        .setLimitOneResponsePerUser(false);
    // .setAllowFileUploads(true); // Redundant but good practice
    console.log("Function not implemented.");
}
function getFirstAndLastDay(data) {
    // Look for the first non empty menu
    let firstDay = "";
    for (let i = 0; i < data.days.length; i++) {
        if (data.menus[i]) {
            firstDay = data.days[i];
            break;
        }
    }
    // Look for the last non empty menu
    let lastDay = "";
    for (let i = data.menus.length - 1; i >= 0; i--) {
        if (data.menus[i]) {
            lastDay = data.days[i];
            break;
        }
    }
    return { firstDay, lastDay };
}
