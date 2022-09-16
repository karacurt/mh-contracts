// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./Marketplace.sol";

//FOR DEBUG ONLY WILL BE REMOVED FOR MERGE
contract MarketplaceDebug is Marketplace {
  using SafeERC20Upgradeable for IERC20;
  using AddressUpgradeable for address;
  using CountersUpgradeable for CountersUpgradeable.Counter;
  struct OrderIdToOrderIndex {
    uint256 orderIndex;
    uint256 orderId;
  }

  OrderIdToOrderIndex[] public ordersDebug;
  uint256 public orderCountDebug;

  function deleteOrder(uint256 orderId) public {
    _deleteOrder(orderId);
  }

  function setOrdersDebug() public {
    delete ordersDebug;
    for (uint256 i = 0; i < orders.length; i++) {
      ordersDebug.push(OrderIdToOrderIndex({orderIndex: i, orderId: orders[i].id}));
    }
  }

  function setFakeIndexFor(uint256 orderId) public {
    uint256 orderIndex = orderIdToOrderIndex[orderId];
    uint256 fakeIndex = orderIndex + 1;

    if (orderIndex == orders.length - 1) {
      fakeIndex = orderIndex - 1;
    }

    orderIdToOrderIndex[orderId] = fakeIndex;
  }

  function setOrdersCount() public {
    orderCountDebug = _orderIdCounter.current();
  }

  function getOrderIdToOrderIndex() public view returns (OrderIdToOrderIndex[] memory) {
    return ordersDebug;
  }

  function getOrderIndex(uint256 orderId) public view returns (uint256) {
    return orderIdToOrderIndex[orderId];
  }

  function getOrdersLength() public view returns (uint256) {
    return orders.length;
  }

  function getLastOrderId() public view returns (uint256) {
    return orders[orders.length - 1].id;
  }

  function getOrderCount() public view returns (uint256) {
    return orderCountDebug;
  }
}
