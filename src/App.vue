<!--
/**
 * @class CanonPartReceive
 * @brief VUE Component providing....
 * @author John Povall<john.povall@speridian.com>
 * @version 1.0
 *
 */
-->

<template>
<v-app>
	<v-snackbar v-model="snackbar" :timeout="snackBarTimeout" :top="true" :color="snackbarcolor" multi-line>
		{{ snackbartext }}
	</v-snackbar>
	<v-main>
		<v-overlay :value="overlay">
			<v-progress-circular indeterminate size="64" />
		</v-overlay>

		<v-container fluid>
			<v-row>
				<v-col v-if="!rowIsSelected">
					<v-row>
						<v-col cols="6">
							<v-text-field v-model="searchQuery" dense clearable prepend-inner-icon="mdi-filter" outlined hint="Examples: 9876543, Smith, pre-approval" persistent-hint label="Filter Results by Keyword" />
						</v-col>
						<v-col>
							<v-btn class="float-end" color="red darken-4 white--text" @click="selectedRow('')">
								Receive New Shipment
							</v-btn>
						</v-col>
					</v-row>

					<v-data-table :loading="receiveResultsLoading" :headers="receiveHeaders" :items="receiveResultsItems" :search="searchQuery" item-key="shipmentNumber" height="600px">
						<template #[`item.actions`]="{ item }">
							<v-btn small color="grey darken-3 white--text" @click="selectedRow(item, index)">
								Details
							</v-btn>
						</template>
					</v-data-table>
				</v-col>
				<v-col v-if="rowIsSelected">
					<v-container v-if="rowIsSelected" fluid>
						<v-row>
							<v-col cols="12">
								<v-form ref="shipNumberForm" v-model="shipNumberFormIsValid" :disabled="shipNumberFormIsDisabled">
									<v-text-field v-model="shipmentNumber" label="Shipment Number" outlined clearable class="required" :rules="[rules.required]">
										<template v-if="newRecord" #prepend>
											<v-icon color="#000000" x-large @click="doShipmentScan">
												mdi-barcode-scan
											</v-icon>
										</template>
									</v-text-field>
								</v-form>
							</v-col>
						</v-row>
						<v-row>
							<v-col cols="12">
								<v-select v-model="selected.receiveStatus" :items="receiveStatuses" label="Receive Status" outlined readonly filled />
							</v-col>
						</v-row>
						<v-row v-if="selected.receiveStatus=='Success'">
							<v-col cols="12">
								<div class="font-weight-black">
									Shipment Received Sucessfully
								</div>
							</v-col>
						</v-row>
						<v-row>
							<v-col cols="12">
								<v-text-field v-model="selected.orderTech" label="Ordering Tech" outlined />
							</v-col>
						</v-row>
						<v-row>
							<v-col cols="12">
								<v-text-field v-model="selected.warehouseName" label="Warehouse" outlined readonly filled />
							</v-col>
						</v-row>
						<v-row>
							<v-col>
								***If the parts that you have physically received do not match the parts listed on the Pick-List/Supplier Shipment list, please call the Parts Department immediately, 609-699-4505 For ESS PARTS For LFS/PPS PARTS Once
								you click the save button you will take ownership of the parts listed on the Pick-List/Supplier Shipment list***
							</v-col>
						</v-row>
						<v-row dense>
							<v-col cols="12">
								<v-btn v-if="newRecord" style="float:right" color="red darken-4 white--text" :disabled="shipmentNumber.length < 5" @click="handleSubmit()">
									Submit
								</v-btn>
								<v-btn v-if="newRecord" style="float:right" color="black--text" @click="handleDismiss()">
									Dismiss
								</v-btn>
								<v-btn v-if="!newRecord" style="float:right" color="red darken-4 white--text" @click="handleDismiss()">
									Dismiss
								</v-btn>
							</v-col>
						</v-row>
					</v-container>
				</v-col>
			</v-row>
		</v-container>
		v1.l5
	</v-main>
</v-app>
</template>

<script>
import CommonPlugin from './mixins/CommonPlugin';
import CommonOIC from '../../mixins/CommonOIC';
import {
	PartReceive
} from "./dataobjects";
export default {
	name: "CanonPartReceive",
	mixins: [CommonPlugin, CommonOIC],
	data: () => ({

		overlay: false,

		// Set up object structure for the expected OFS configuration parameters and properties.  This allows us to run a routine to check
		// if all config parameters exist and are valid.  Initial values here should always be null.
		ofs: {
			config: {
				oicUser: {
					description: 'Username for OIC instance',
					value: null,
					required: true
				},
				oicPassword: {
					description: 'Password for OIC instance',
					value: null,
					required: true
				},
				receiveSearchEndpoint: {
					description: 'Endpoint used to search for Receive Shipments',
					value: null,
					required: true
				},
				receiveCreateEndpoint: {
					description: 'Endpoint used to create Receive record in external database',
					value: null,
					required: true
				}

			},
			props: {
				Lob: {
					description: 'The Canon line of business',
					value: null,
					required: true
				},

				technicianId: {
					description: 'The Canon Technician ID (OFS external ID)',
					value: null,
					required: true
				},
				ofsUsername: {
					description: 'The Canon Technician OFS Username',
					value: null,
					required: true
				},

			}
		},

		Receive: [],
		selected: {},
		shipmentNumber: "",
		newRecord: false,
		rowIsSelected: false,

		receiveStatuses: ['Submitted', "Success", "Failed", "Completed"],

		rules: {
			required: value => !!value || 'Required',
			isValidShipNumber: value => (/^[A-Z0-9]{4,25}$/.test(value)) || 'Must be a valid Ship Number'
		},

		shipNumberFormIsValid: true,
		shipNumberForm: null,
		shipNumberFormIsDisabled: false,

		receiveHeaders: [
			{
				text: 'Shipment Number',
				value: 'shipmentNumber'
			},
			{
				text: 'Status:',
				value: 'receiveStatus'
			},
			{
				text: 'Warehouse:',
				value: 'warehouseName'
			},
			{
				text: 'Action',
				value: 'actions'
			}
		],

		searchOptions: [
			{
				title: "Shipment No",
				value: "shipmentNumber"
			},
			{
				title: "Warehouse",
				value: "warehouseName"
			},
			{
				title: "WH Code",
				value: "warehouse_code"
			},
			{
				title: "Status",
				value: "receiveStatus"
			},
 		],

		searchField: "shipmentNumber",
		searchQuery: "",

		receiveResultsItems: [],
		receiveResultsLoading: false,
	}),
	computed: {

	},
	/**
	 * Instance lifecycle hook which runs upon create of the VUE component.
	 * @return (void)
	 */
	created: function () {
		this.log('created() - BEGIN');

		// Localhost or standalone domain testing (not running within OFS at all)
		if (window.self === window.top) {
			this.log('Mode: localhost or standalone');

			// Set any test data for running standalone, outside of OFS...
			//this.ofs.config.receiveSearchEndpoint.value = './receiveSearch.json'; // mock endpoint
			this.ofs.config.receiveSearchEndpoint.value = 'https://csaofsintegrationdev-axbidh7pqpgy-ia.integration.ocp.oraclecloud.com/ic/api/integration/v1/flows/rest/PLUGIN_GET_PART_RECEIVE/1.0/lob/'; // OIC endpoint
			this.ofs.config.receiveCreateEndpoint.value =  'https://csaofsintegrationdev-axbidh7pqpgy-ia.integration.ocp.oraclecloud.com/ic/api/integration/v1/flows/rest/NSBI1110_OFS_R_INT/1.0/' // OIC endpoint
			//'https://csaofsintegrationdev-axbidh7pqpgy-ia.integration.ocp.oraclecloud.com/ic/api/integration/v1/flows/rest/GENERIC_PLUGIN_POST/1.0/genericpost';// MOCK endpoint 
			this.ofs.config.oicUser.value = ''; // <-- Delete after any localhost development or testing!
			this.ofs.config.oicPassword.value = ''; // <-- Delete after any localhost development or testing!
			this.ofs.props.Lob.value =  'WTS'; //'PPS-LFS';
			this.ofs.props.technicianId.value = 'K02339'; //'C19797';
			this.ofs.props.ofsUsername.value = 'jpovall';


			this.initializePlugin();
		} else {
			this.log('Mode: OFS');

			// Define the handler for message events from Field Service
			window.addEventListener('message', this.handleOfsPostMessage);


			// Tell Field Service our plugin is ready
			var msg = {
				apiVersion: 1,
				method: 'ready',
				sendInitData: false,
				showHeader: true,
				enableBackButton: true
			};
			this.postMessage(msg, '');


		}
		
	},

	methods: {
		searchClick: function () {
			alert(this.searchQuery);
		},
		selectedRow: function (item) {
			this.log(item);
			if (this.isObject(item)) {
				this.newRecord = false;
				this.selected = item;
				this.shipmentNumber = item.shipmentNumber; // for the scan populate .  won't show in text box if object property
			} else {
				this.selected = {};
				this.shipmentNumber = "";
				this.newRecord = true;
			}
			this.rowIsSelected = true;
			if (this.$refs.shipNumberForm !== undefined) this.$refs.shipNumberForm.resetValidation();
		},
		doShipmentScan() {
			var msg = {
				apiVersion: 1,
				method: "callProcedure",
				procedure: "scanBarcode",
				callId: this.generateCallId()
			};

			this.postMessage(msg, '');
		},
		processProcedureResult: function (receivedData) {
			this.shipmentNumber = receivedData.resultData.text;
		},
		_getReceivedShipments: function () {

			let i, ii = 0;

			this.receiveResultsLoading = true;
			
			let endpointUrl = this.ofs.config.receiveSearchEndpoint.value + this.ofs.props.Lob.value + '/techid/' + this.ofs.props.technicianId.value  ;
			this.makeApiRequest('GET', endpointUrl, this.ofs.config.oicUser.value, this.ofs.config.oicPassword.value, null, this.processReceiveResponse);
		},

		handleSubmit() {

			this.overlay = true;

			const d = new Date();

			let newReceive = {};
			newReceive.PartsReceiveCreate = [];
			let PartsReceive = {};
			PartsReceive.PartsReceive = {};
			newReceive.LastUpdatedBy =  this.ofs.props.ofsUsername.value;
			newReceive.CreatedBy =  this.ofs.props.ofsUsername.value;
			PartsReceive.PartsReceive.ReceivingTechnician = this.ofs.props.technicianId.value;
			newReceive.InterfaceTransactionId = 123456;
			PartsReceive.PartsReceive.ShipmentNo = this.shipmentNumber;
			PartsReceive.PartsReceive.ReceiveStatus = "Submitted";
			PartsReceive.PartsReceive.UpdatedDate = this.formatDateTime(d);
			//PartsReceive.PartsReceive.PartsReceiptId = 123;
			PartsReceive.PartsReceive.AssignedTechnician = this.selected.orderTech
			newReceive.PartsReceiveCreate.push(PartsReceive)
			newReceive.LobName = this.ofs.props.Lob.value;
			newReceive.Operation = "Operation";
  			newReceive.EndPoint = "NSBI1110_PartsReceive_EndPoint";
  			newReceive.CrudType = "CREATEORUPDATE";

			//set screen fields
			this.selected.receiveStatus = PartsReceive.PartsReceive.ReceiveStatus;
			this.selected.updatedDate = PartsReceive.PartsReceive.UpdatedDate;
			this.selected.shipmentNumber = this.shipmentNumber;

			this.makeApiRequest('POST', this.ofs.config.receiveCreateEndpoint.value, this.ofs.config.oicUser.value, this.ofs.config.oicPassword.value, newReceive, this.processReceiveCreateResponse)
			this.showSnackBar('orange', "receive sent");
		},
		processReceiveCreateResponse: function (respObj) {
			this.log('processReceiveCreateResponse() - BEGIN');

			this.log(respObj);

			if (typeof respObj !== 'undefined' && typeof respObj.CanonInboundResponse !== 'undefined' && typeof respObj.CanonInboundResponse.status !== 'undefined') {
				if (respObj.CanonInboundResponse.status == '0' || respObj.CanonInboundResponse.status == '1' || respObj.CanonInboundResponse.status== 'Success') {
					if (respObj.CanonInboundResponse.code == '2') {
						this.showSnackBar('orange', 'Sent Sucessfully Again!');
					} else {
						this.receiveResultsItems.push(this.selected);
						this.showSnackBar('green', 'Sent Sucessfully !');
					}
					this.handleDismiss();
				} else {
					this.showSnackBar('red',  respObj.CanonInboundResponse.message,3000);
				}

			} else {
				//
				this.showSnackBar('red', 'Invalid response received from the server!');
			}
			this.overlay = false;

		},
		processReceiveResponse: function (respObj) {
			this.log('processReceiveResponse() - BEGIN');

			this.log(respObj);

			if (typeof respObj !== 'undefined' && typeof respObj.result !== 'undefined' && typeof respObj.result.code !== 'undefined') {
				if (respObj.result.code == '0') {
				//	this.showSnackBar('green', 'Result found!');

					let self = this;
					//respObj.data = this.Receive;
					respObj.data.forEach(function (item) {
						self.receiveResultsItems.push(item);
					});

				} else {
				//	this.showSnackBar('green', respObj.result.message);
				}
			} else {
				//
				this.showSnackBar('red', 'Invalid response received from the server!');
			}
			this.receiveResultsLoading = false;
		},

		handleDismiss() {
			this.selected = {};
			this.rowIsSelected = false;
		},

		/**
		 * Business login on plugin open
		 *
		 * @param {Object} ofsData - JSON object that contain data from OFS
		 */
		pluginOpen: function (ofsData) {

			// Set required config values
			this.ofs.config.receiveSearchEndpoint.value = ofsData.securedData.receiveSearchEndpoint;
			this.ofs.config.receiveCreateEndpoint.value = ofsData.securedData.receiveCreateEndpoint;
					
			this.ofs.config.oicUser.value = ofsData.securedData.oicUser;
			this.ofs.config.oicPassword.value = ofsData.securedData.oicPassword;
			
			// Set required properties
			this.ofs.props.technicianId.value = ofsData.resource.external_id;
			this.ofs.props.Lob.value = ofsData.resource.canon_resource_lob;
			this.ofs.props.ofsUsername.value = ofsData.user.uname;
			
			this.initializePlugin();
		},

		initializePlugin: function()
		{
			this.log('initializePlugin() - BEGIN');

			// Check the plugin configuration.  If it is valid initialize the plugin.
			if (this.validatePluginConfiguration() === true)
			{
				// retreive previous received shipments
				this._getReceivedShipments();
			}
			else
			{
				this.showSnackBar('red', 'Some expected configuration values or properties are missing or invalid!  Check the plugin configuration and verify the necessary data elements in OFS are populated with data.');
			}

		},

		
		open() {},
		close() {},
		padTo2Digits(num) {
			return num.toString().padStart(2, '0');
		},
		formatDate(date) {
			return [
				this.padTo2Digits(date.getMonth() + 1),
				this.padTo2Digits(date.getDate()),
				date.getFullYear(),
			].join('/');
		}
	},
};
</script>
<style>
.required label::after {
	content: "*";
	color: red;
	font-weight: bold
}

.myhover {
	cursor: pointer;
	line-height: 16px;
}

.myhover:hover {
	background-color: lightgray;
}

.table_key {
	font-weight: bolder;
	font-size: 1.2em;
	color: #000;
}

.table_details {
	color: darkblue;
}
</style>
