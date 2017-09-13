/****************************************************************************
 ****************************************************************************
    
    Initialize
    
*****************************************************************************
*****************************************************************************/
const displayTable  = require("./displayTable.js");
const validateInput = require("./validateInput.js");

const colors   = require("colors");
const inquirer = require("inquirer");
const mysql    = require("mysql");

// Create a local copy of items (id)
let items;

const connection = mysql.createConnection({
    "host"              : "localhost",
    "port"              : 3306,
    "user"              : "root",
    "password"          : "",
    "database"          : "bamazon_db",
    "multipleStatements": true
});

connection.connect(error => {
    try {
        if (error) throw "Error: Connection to bamazon_db failed.\n";

    } catch(error) {
        displayError(error);

    }

    connection.query("SELECT item_id FROM products", (error, results) => {
        try {
            if (error) {
                throw "Error: Creating a local copy failed.\n";

            } else if (results.length === 0) {
                throw "Error: products table is empty.\n";

            }

            items = results.map(r => r.item_id);

            menu_customer();
            
        } catch(error) {
            displayError(error);

        }

    });
});



/****************************************************************************
 ****************************************************************************
    
    Methods for customers
    
*****************************************************************************
*****************************************************************************/
function menu_customer() {
    clearScreen();

    console.log("--- Available Items ---\n");

    const sql_command =
        `SELECT p.item_id, p.product_name, d.department_name, p.price, p.stock_quantity
         FROM products AS p
         INNER JOIN departments AS d
         ON p.department_id = d.department_id`;

    connection.query(sql_command, (error, results) => {
        try {
            if (error) throw `Error: Displaying products table failed.\n`;

            displayTable(results, 10);

            buyItem();

        } catch(error) {
            displayError(error);

        }

    });
}

function buyItem() {
    inquirer.prompt([
        {
            "type"    : "input",
            "name"    : "item_id",
            "message" : "Enter the ID of the item that you want to buy:",
            "validate": value => (value !== "" && !isNaN(value) && items.indexOf(parseFloat(value)) >= 0)
        },
        {
            "type"    : "input",
            "name"    : "buy_quantity",
            "message" : "Enter the quantity that you want to buy:",
            "validate": validateInput.isWholeNumber
        },
        {
            "type"   : "confirm",
            "name"   : "continue",
            "message": "Buy another item?",
            "default": true
        }

    ]).then(response => {
        const item_id      = parseInt(response.item_id);
        const buy_quantity = parseInt(response.buy_quantity);

        const sql_command =
            `UPDATE products
             SET product_sales  = IF(stock_quantity >= ${buy_quantity}, product_sales + ${buy_quantity} * price, product_sales),
                 stock_quantity = IF(stock_quantity >= ${buy_quantity}, stock_quantity - ${buy_quantity}, stock_quantity)
             WHERE item_id = ${item_id};

             SELECT product_name, price FROM products WHERE item_id = ${item_id};`;

        connection.query(sql_command, (error, results) => {
            try {
                if (error) throw `Error: Updating item #${item_id} failed.\n`;

                if (results[0].changedRows === 1) {
                    console.log("\nCongratulations, you bought ".white + `${buy_quantity} ${results[1][0].product_name}'s`.yellow.bold + "!".white);
                    console.log(`Subtotal: $${(buy_quantity * results[1][0].price).toFixed(2)}\n`.white);

                } else if (buy_quantity > 0) {
                    console.log("\nSorry, we do not have ".white + `${buy_quantity} ${results[1][0].product_name}'s`.yellow.bold + " in stock.\n".white);

                } else {
                    console.log("\nThat's all right. No pressure to buy ".white + `${results[1][0].product_name}'s`.yellow.bold + " right now.\n".white);

                }

            } catch(error) {
                displayError(error);

            } finally {
                setTimeout((response.continue) ? menu_customer : exitProgram, 2000);

            }

        });

    });
}

function exitProgram() {
    clearScreen();

    console.log("Thank you for shopping with Bamazon!".white);

    connection.end();
}



/****************************************************************************
 ****************************************************************************
    
    Helper functions
    
*****************************************************************************
*****************************************************************************/
function clearScreen() {
    process.stdout.write("\033c");
}

function displayError(error) {
    console.log(error.red.bold);

    connection.end();
}