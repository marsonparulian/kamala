// Master of order form, to be cloned
const MASTER_FORM_ID = "1Lab_Wbbug5J9aVg11ZcgGrqTC2vbszjmwuUD_JGxBEU";

/**
 * The folder of the forms.
 * @param space{string} - ID / space of the forms, e.g.: Kanisius, Gonzaga, etc.
 */
function getOrderFormsFolderId(space = "kanisius") {
  // Note: Could generate for gonzaga, not kanisius.
  if (space == "gonzaga") {
    return "gonzaga-order-form-id";
  } else {
    // Kanisius as default
    return "1Iaj3a-Hv0-MUWWpJj9TXWTQU5Zmacwh8";
  }
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile("generator").setSandboxMode(
    HtmlService.SandboxMode.IFRAME
  );
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
  const dates: string[] = [];

  // Get today's date
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  let monday;

  // If today is Monday, use today. Otherwise, find the next Monday.
  if (dayOfWeek === 1) {
    monday = today;
  } else {
    // Calculate the number of days to add to get to the next Monday
    const daysToAdd = (1 + 7 - dayOfWeek) % 7;
    monday = new Date(today);
    monday.setDate(today.getDate() + daysToAdd);
  }

  // Add Monday to the array
  dates.push(
    `${dayNames[monday.getDay()]} ${monday.getDate()} ${
      monthNames[monday.getMonth()]
    }`
  );

  // Loop to get Tuesday, Wednesday, Thursday, and Friday
  for (let i = 1; i < 5; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    dates.push(
      `${dayNames[nextDay.getDay()]} ${nextDay.getDate()} ${
        monthNames[nextDay.getMonth()]
      }`
    );
  }

  return dates;
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
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
function processForm(formData: {
  "days[]": string[];
  "menus[]": string[];
  "prices[]": string[];
}) {
  console.log("ProcessForm..");

  // The folder to save the form
  const folderId = getOrderFormsFolderId();
  const folder = DriveApp.getFolderById(folderId);

  // Acquire the form data
  const days = formData["days[]"];
  const menus = formData["menus[]"];
  const prices = formData["prices[]"];

  // console.log(days);
  // console.log(menus);
  // console.log(prices);

  // FIXME
  return cloneFormAndModify();

  const formTitle = "form title 2";
  const formDesc =
    "This is the description. <br /> " + menus[0] + "<br /> " + menus[1];

  // The form id that will be set later. Also will be used to move the file in the 'finally' block
  let formId = "";

  try {
    // Create a form in the ORDER_FORMS_FOLDER with the above title, then add the description
    console.log("Creating form..");
    const form = FormApp.create(formTitle);
    form.setDescription(formDesc);
    console.log("Finish setting description");

    // Loop the `menus`. On every menus that is not empty, add radio box to the form with options "A", "B", "C", and "D".
    for (let i = 0; i < menus.length; i++) {
      if (menus[i] && menus[i].trim() !== "") {
        const item = form.addMultipleChoiceItem();
        item
          .setTitle(days[i] + " - " + menus[i] + " (Rp " + prices[i] + ")")
          .setChoiceValues(["A", "B", "C", "D"]);
      }
    }

    console.log("Finish adding multiple choices");

    // form.addSomethingNotExist();

    // At the end of the form add file upload input with maximum file upload is 10 Mb.
    // form
    //   .addFileUploadItem()
    //   .setTitle("Upload bukti pembayaran")
    //   .setHelpText("Maximum file size is 10MB.")
    //   .setDestinationFolder(folder)
    //   .setMaxFileSize(10 * 1024 * 1024);

    console.log("Finishadd file upload");

    // Form settings:
    form
      .setCollectEmail(true)
      // .setRequireLogin(true) // Required for file upload
      .setAllowResponseEdits(false)
      .setLimitOneResponsePerUser(false);
    // .setAllowFileUploads(true); // Redundant but good practice

    console.log("Finish set additional settings");

    // Publish the form right away.
    console.log("publishing form..");
    // form.setPublished(true);
    const formUrl = form.getPublishedUrl();
    formId = form.getId();
    console.log(`form id is set : ${formId}`);

    // If the from successfuly published:
    // 1. Save the link of the form to script attribute 'kanisius-last-form-url'
    PropertiesService.getScriptProperties().setProperty(
      "kanisius-last-form-url",
      formUrl
    );

    // 2. Save the id of the form to script attribute 'kanisius-last-form-id'
    PropertiesService.getScriptProperties().setProperty(
      "kanisius-last-form-id",
      formId
    );

    // 3. Save the success / failure of the form publication to script attribute 'kanisius-last-form-generation'. The value set to 'true'.
    PropertiesService.getScriptProperties().setProperty(
      "kanisius-last-form-generation",
      "true"
    );

    // 4. Display 'success' html file.
    return HtmlService.createHtmlOutputFromFile("success");
  } catch (error: any) {
    // Log error
    if (error instanceof Error) {
      console.error(`Failed to generate form: ${error.message}`);
    } else {
      console.error(`Unknown error : ${String(error)}`);
    }

    // If the form NOT successfuly published do :
    // 1. Set script attribute 'kanisius-last-form-generation' to 'false'.
    PropertiesService.getScriptProperties().setProperty(
      "kanisius-last-form-generation",
      "false"
    );

    // 2. Display 'failure' html file
    return HtmlService.createHtmlOutputFromFile("failure");
  } finally {
    // If form id is set, move the form file to the destination folder
    if (formId) {
      const destinationFolder = DriveApp.getFolderById(folderId);
      const formFile = DriveApp.getFileById(formId);
      formFile.moveTo(destinationFolder);
    }
  }
}

function cloneFormAndModify() {
  // Replace with the ID of the source form you want to clone.
  // You can find the ID in the URL of the form: docs.google.com/forms/d/YOUR_FORM_ID/edit
  const sourceFormId = MASTER_FORM_ID;

  console.log("Starting cloneFormAndModify");
  console.log(`sourceFormId : ${sourceFormId}`);

  // Get the source form by its ID
  const sourceForm = FormApp.openById(sourceFormId);

  console.log("Success retrieving the source form");
  console.log(`sourceForm : ${sourceForm}`);
  console.log(`sourceForm title :  ${sourceForm.getTitle()}`);
  console.log(` ${sourceForm.getItems().length}`);
  console.log(` ${sourceForm.getDescription()}`);

  // Create a copy of the source form. This also copies all existing questions.
  const driveClonedFile = copyFile();
  // Retrieve the cloned form by id
  const clonedForm = FormApp.openById(driveClonedFile.getId());

  // Get all items from the cloned form
  const items = clonedForm.getItems();

  // Find the file upload item. Assuming there's only one.
  const fileUploadItem = items.find(
    (item) => item.getType() === FormApp.ItemType.FILE_UPLOAD
  );

  // Remove the file upload item from its original position
  // if (fileUploadItem) {
  //   clonedForm.deleteItem(fileUploadItem.getIndex());
  // }

  // Prepend a paragraph item
  clonedForm
    .addParagraphTextItem()
    .setTitle("Please read this carefully")
    .setHelpText("This is a new section for you to provide information.");

  // Re-add the file upload item to the end of the form
  if (fileUploadItem) {
    //   clonedForm.addFileUploadItem()
    //     .setTitle(fileUploadItem.getTitle())
    //     .setHelpText(fileUploadItem.getHelpText())
    //     .setRequired(fileUploadItem.isRequired())
    //     // .setFolderId(fileUploadItem.asFileUploadItem().getDestinationFolder().getId())
    //     .setLimit(fileUploadItem.asFileUploadItem().getFileLimit())
    //     .setAllowMultiple(fileUploadItem.asFileUploadItem().isAllowingMultipleFiles())
    //     .setAllowedFileTypes(fileUploadItem.asFileUploadItem().getAllowedFileTypes());

    console.log("Before setup upload folder");

    // Set the upload folder
    setUploadFolder(clonedForm);
  }

  // Moves the first item to be the last item.
  console.log("Before moveItem");
  clonedForm.moveItem(0, clonedForm.getItems().length - 1);

  console.log("end of this function");
}
/**
 * Copy master form.
 * Copying file is the only way to have the 'upload file' item in the form, since AppScript API does not provide method to add 'file upload'
 * @return {GoogleAppsScript.Drive.File} the copied form.
 */
function copyFile(): GoogleAppsScript.Drive.File {
  const sourceFormId = MASTER_FORM_ID;
  // Optional: Replace with the ID of the destination folder
  // If not specified, the copy will be placed in the root of your Drive
  const destinationFolderId = getOrderFormsFolderId();

  const sourceFile = DriveApp.getFileById(sourceFormId);

  // Create a new name for the copied form
  const newFormName = sourceFile.getName() + " (Copy)";
  let copiedFile: GoogleAppsScript.Drive.File | null = null;

  if (destinationFolderId) {
    const destinationFolder = DriveApp.getFolderById(destinationFolderId);
    copiedFile = sourceFile.makeCopy(newFormName, destinationFolder);
  } else {
    copiedFile = sourceFile.makeCopy(newFormName);
  }

  // Throw error if copying process is failed
  if (copiedFile === null) {
    throw new Error(
      "Failed copying file in DriveApp :" +
        newFormName +
        " to " +
        destinationFolderId
    );
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

  for (let i = 0; i < items.length; i++) {
    console.log(`item type : ${items[i].getType().name()}`);
    if (items[i].asFileUploadItem) {
      console.log(`item #${items[i]} has 'asFileUploadItem`);
    } else {
      console.log(`item #${items[i]} has NOT 'asFileUploadItem`);
    }
  }
  if (items.length > 0) {
    // const fileUploadItem = items[0].asFileUploadItem();
    // // Assign the new folder's ID to the file upload question.
    // fileUploadItem.setDestinationFolder(uploadFolder);
  }
}

function testFunction() {
  console.log("This is a test function");
}
