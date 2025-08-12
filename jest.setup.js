// This file sets up a mock environment for Google Apps Script services
// so that Jest can run tests without a live connection.

// Define global Apps Script objects with mock implementations
global.SpreadsheetApp = {
  openById: jest.fn(() => ({
    getSheetByName: jest.fn(() => ({
      getRange: jest.fn(() => ({
        getValues: jest.fn(() => []),
      })),
    })),
  })),
};

global.FormApp = {
  openById: jest.fn(() => ({
    // Mock the Form object's methods here
    getId: jest.fn(() => "mock-form-id"),
    getTitle: jest.fn(() => "Mock Form"),
  })),
  create: jest.fn(() => ({
    // Mock the Form object's methods for creation
    getId: jest.fn(() => "mock-new-form-id"),
  })),
};

global.DriveApp = {
  getFileById: jest.fn(() => ({
    // Mock the File object's methods
    getName: jest.fn(() => "Mock File.txt"),
  })),
  createFile: jest.fn(() => ({
    // Mock the new File object
    getId: jest.fn(() => "mock-new-file-id"),
  })),
};

// You can add more services here as needed, e.g.,
// global.MailApp = { ... };
