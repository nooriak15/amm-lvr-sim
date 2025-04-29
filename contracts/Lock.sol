// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleAMM {
    uint public reserve0;
    uint public reserve1;
    uint public feeBps = 30;

    event Swap(address trader, uint amountIn, uint amountOut, uint price);

    function addLiquidity(uint amount0, uint amount1) public {
        reserve0 += amount0;
        reserve1 += amount1;
    }

    function getPrice() public view returns (uint) {
        require(reserve0 > 0 && reserve1 > 0, "No liquidity");
        return (reserve1 * 1e18) / reserve0;
    }

    function swap(uint amount0In) public returns (uint amount1Out) {
        require(amount0In > 0, "zero in");
        uint amount0InWithFee = amount0In * (10000 - feeBps) / 10000;
        uint newReserve0 = reserve0 + amount0InWithFee;
        uint k = reserve0 * reserve1;
        uint newReserve1 = k / newReserve0;
        amount1Out = reserve1 - newReserve1;

        reserve0 += amount0InWithFee;
        reserve1 = newReserve1;

        emit Swap(msg.sender, amount0In, amount1Out, getPrice());
    }
}
