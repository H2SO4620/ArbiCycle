// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @notice Deployable mocks for chains where USDC / Aave v3 are not yet live
 *         (Robinhood Chain testnet). Anyone can mint test USDC via faucet().
 */
contract MockUSDC {
    string  public constant name     = "Mock USDC";
    string  public constant symbol   = "USDC";
    uint8   public constant decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply   += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Open faucet — 1,000 USDC per call, for testnet demos.
    function faucet() external {
        mint(msg.sender, 1_000e6);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract MockAUsdc {
    string public constant name     = "Mock aUSDC";
    string public constant symbol   = "aUSDC";
    uint8  public constant decimals = 6;

    address public immutable pool;
    mapping(address => uint256) public balanceOf;

    modifier onlyPool() { require(msg.sender == pool, "only pool"); _; }

    constructor(address _pool) { pool = _pool; }

    function mint(address to, uint256 amount) external onlyPool { balanceOf[to] += amount; }
    function burn(address from, uint256 amount) external onlyPool { balanceOf[from] -= amount; }
}

contract MockAavePool {
    MockUSDC  public immutable usdc;
    MockAUsdc public immutable aUsdc;

    constructor(address _usdc) {
        usdc  = MockUSDC(_usdc);
        aUsdc = new MockAUsdc(address(this));
    }

    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        aUsdc.mint(onBehalfOf, amount);
    }

    function withdraw(address, uint256, address to) external returns (uint256) {
        uint256 amount = aUsdc.balanceOf(msg.sender);
        aUsdc.burn(msg.sender, amount);
        usdc.transfer(to, amount);
        return amount;
    }
}
