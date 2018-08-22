export default interface ICrmService
{
	/**
	 * Initialises connection parameters and tests the connection. This should be run the first thing.
	 * @returns The current user ID.
	 * @memberof CrmService
	 */
	initialise(): Promise<string>;
	
	// execute(): ;

	// get(): ;
	
	// post(): ;
	
	// put(): ;

	// patch(): ;

	// delete(): ;
}
