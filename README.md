# Canon Part Receive Plugin

**Note: Using Node.js v16.14.2 (latest LTS as of 04/18/2022).**

&nbsp;

## Purpose

The purpose of the Part Receive plugin is to allow techs accept ordered part shipments. A technician can receive a shipment ordered by another tech. The part receive data is stored in the external database. The plugin will query the database via OIC.

See FDD for the CR 9.6 Part Receive use cases which will be included in the plugin.


&nbsp;

## UI Design Details

1. Plug-in opens receive shipment screen.
1. Can scan the shipping number or enter it.
1. When save button is clicked, the form is validated. Response Status is set to Submitted, the data saved in external DB via OIC and an API Call is sent to external system via OIC.
1. Click on a row to view the details. Click the spyglass to search for a shipment number. Request status and Warehouse name will be shown in the list of shipments.
1. Once Shipment is submitted, the form data is read-only.


&nbsp;

## OIC Endpoints

Please refer to the “Integration List” section in the document “TDD_Canon_OFS_Impl_Part_1-of3_Architecture+OIC_v1x” for OIC endpoint information


&nbsp;

## Additional Requirements and Logic

- The Parts Receive Plugin will receive Status of Success or Failure after S21 validates via Parts receive acknowledgment interface NSBI1270.
- The Parts Request Plugin will receive Delivered Quantity update through NSBI1140.  Inventory Plugins will receive inventory updates through NSBI1080 from external system via OIC after technician completes the part receive process and the external system has adjusted the inventory.

&nbsp;

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
