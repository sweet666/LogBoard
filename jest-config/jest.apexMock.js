// Provides a jest.fn() stub for every @salesforce/apex/<Class>.<method> import.
// Individual tests can override behaviour with mockResolvedValue / mockRejectedValue.
module.exports = jest.fn();
