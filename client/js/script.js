$( ".file_d" ).change( function() {
		
	var currentFile = document.getElementById('files').files[0];
	var type_of_file;

	if (currentFile.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") 
		type_of_file = "Document";
	else type_of_file = currentFile.type;
	
	document.getElementById('name_of').innerHTML =  currentFile.name;
	document.getElementById('type_of').innerHTML = type_of_file;
	document.getElementById('size_of').innerHTML = parseInt(currentFile.size/1024) + " КБ";


});