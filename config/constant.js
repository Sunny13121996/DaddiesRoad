const shipmentStatus = {
    atPickUp         : 0,
	pickUpConfimed   : 1,
	onTheWayDelivery : 2,
	atDelivery       : 3,
	delivered        : 4,
	couldNotDeliver  : 5,
    cancelDeliver    : 6
};

module.exports = {
    shipmentStatus   : shipmentStatus
}