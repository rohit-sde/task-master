const err = (message = 'Sorry!', data = null) => {
	return {
		status: 0,
		message,
		data
	}
}
const ret = (data = null, message = null) => {
	return {
		status: 1,
		data,
		message
	}
}
const emailTemplate = (html, css) => {
	return `
	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html xmlns="http://www.w3.org/1999/xhtml">
		<head>
			 <meta charset="utf-8">
			 <meta name="viewport" content="width=device-width">
			 <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
			<title>Code Computerlove - Responsive Email Template</title>
			<style type="text/css">
	
			body {
				margin: 0;
				padding: 0;
				min-width: 100%!important;
			}
	
			.content {
				width: 100%;
				max-width: 600px;
			}

			${css}
	
			</style>
		</head>
		<body bgcolor="#fff">
			<table width="100%" bgcolor="#fff" border="0" cellpadding="0" cellspacing="0" role="presentation">
				<tr>
					<td>
						<table class="content" align="center" cellpadding="0" cellspacing="0" border="0" role="presentation">
							<tr>
								<td>
									${html}
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
	</html>
	`
}

module.exports = {
	err,
	ret,
	emailTemplate
}