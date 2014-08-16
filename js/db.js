


function encodeString(str) {
    str=encodeURIComponent(str);
    str = str.replace(/'+/gim, convertCharStr2UTF8("'"));
    // str = str.replace(/"+/gi, convertCharStr2UTF8('"'));
    // str= str.replace(/%([^\d].)/, "%25$1");
   return str;
    
}

function decodeString(str) {
    if (typeof str == "string") {
        var singleQuoteUTF = convertCharStr2UTF8("'"),
        //     doubleQuoteUTF = convertCharStr2UTF8('"'),
            replacementRegexSingleQuote = new RegExp(singleQuoteUTF, "gim");
        //     replacementRegexDoubleQuote = new RegExp(doubleQuoteUTF, "gim");
        str=decodeURIComponent(str);
        str = str.replace(replacementRegexSingleQuote, "'");
        return str;
        // console.log(str);
        
    } else {
        return str;
    }

}

function toBinArray(str) {
    var l = str.length,
        arr = new Uint8Array(l);
    for (var i = 0; i < l; i++) arr[i] = str.charCodeAt(i);
    return arr;
}

function toBinString(arr) {
    var uarr = new Uint8Array(arr);
    var strings = [],
        chunksize = 0xffff;
    // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
    for (var i = 0; i * chunksize < uarr.length; i++) {
        strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
    }
    return strings.join('');
}
var dbRef = window.localStorage.getItem("confbox.sqlite");
if (dbRef) {
    var db = new SQL.Database(toBinArray(dbRef));
} else {
    var db = new SQL.Database();
    db.exec("PRAGMA encoding = \"UTF-8\"");
}


function createTables() {
    if (!db) {
        console.log('Database error');
        return;
    }

    var queryString = "",
        tableList = [];
    queryString = 'CREATE TABLE IF NOT EXISTS conferences(id_conference INTEGER  NOT NULL PRIMARY KEY, conference_name TEXT NOT NULL, conference_key TEXT NOT NULL,conference_abbreviation TEXT NOT NULL,conference_description TEXT NOT NULL,conference_logo TEXT NULL DEFAULT NULL,conference_start_date TEXT NOT NULL,conference_end_date TEXT NOT NULL,conference_url TEXT NULL,conference_pol_lat TEXT NULL,conference_pol_lng TEXT NULL ,created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL,about TEXT NULL DEFAULT NULL, contact TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS tracks(id_track INTEGER  NOT NULL PRIMARY KEY, track_name TEXT NOT NULL, track_description TEXT NULL,conference TEXT NOT NULL,created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS paper_types(id_paper_type INTEGER  NOT NULL PRIMARY KEY, paper_type_name TEXT NOT NULL, paper_type_field TEXT NULL,created_at TEXT NOT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS organizations(id_organization INTEGER  NOT NULL PRIMARY KEY, organization_name TEXT NOT NULL, organization_zip TEXT NULL, organization_address TEXT NOT NULL, organization_phone TEXT NULL DEFAULT NULL, organization_city TEXT NULL, organization_country TEXT NOT NULL, organization_email TEXT NULL DEFAULT NULL, organization_VAT TEXT NULL, organization_url TEXT NULL DEFAULT NULL, created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS papers(id_paper INTEGER  NOT NULL PRIMARY KEY, paper_name TEXT NOT NULL,paper_date TEXT NOT NULL, paper_type TEXT NOT NULL,paper_summary text default null,track TEXT NOT NULL,created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS participants(id_participant INTEGER  NOT NULL PRIMARY KEY, participant_name TEXT NOT NULL, participant_surname TEXT NOT NULL, participant_academic_title TEXT NOT NULL,participiant_picture text default null,participiant_field text default null, participant_address TEXT NOT NULL, participant_city TEXT NOT NULL, participant_country TEXT NOT NULL, participant_zip_code TEXT NOT NULL, participant_phone TEXT NOT NULL, participant_email TEXT NOT NULL,participiant_biography text default null,organization TEXT NOT NULL, conference TEXT NOT NULL, created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS authors(participant_paper INTEGER  NOT NULL, paper TEXT NOT NULL,author_picture text default null, created_at TEXT NOT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL,id_author INTEGER NOT NULL PRIMARY KEY);';
    queryString += 'CREATE TABLE IF NOT EXISTS locations(id_location INTEGER NOT NULL, location_name TEXT NOT NULL, location_address TEXT NULL DEFAULT NULL, location_capacity TEXT NULL DEFAULT NULL, location_description TEXT NOT NULL, location_picture TEXT NOT NULL, conference TEXT NOT NULL,lat TEXT NULL,lng TEXT NULL,  created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS sessions(id_session INTEGER NOT NULL,session_name TEXT NULL DEFAULT NULL,session_date TEXT NULL DEFAULT NULL,session_time TEXT default null,tracks TEXT NOT NULL, location TEXT NOT NULL,  created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS chairs(participant_chair INTEGER  NOT NULL, sessions_chair INT NOT NULL, created_at TEXT NOT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL,id_chair INTEGER NOT NULL PRIMARY KEY);';
    queryString += 'CREATE TABLE IF NOT EXISTS event_types(id_event_type INTEGER  NOT NULL PRIMARY KEY, event_type_name TEXT NOT NULL, event_type_field TEXT NULL DEFAULT NULL, created_at TEXT NOT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS events(id_event INTEGER  NOT NULL PRIMARY KEY, event_name TEXT NOT NULL, event_description TEXT NOT NULL, event_time TEXT NULL DEFAULT NULL, event_duration_min TEXT NULL DEFAULT NULL, paper TEXT NULL DEFAULT NULL, event_type TEXT NOT NULL, session TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS news(id_news INTEGER  NOT NULL PRIMARY KEY, conference TEXT NTEGER NULL, news_heading TEXT NOT NULL, news_time TEXT NOT NULL, news_content TEXT NOT NULL, news_url TEXT NULL DEFAULT NULL, created_at TEXT NOT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS participant_types(id_participant_type INTEGER  NOT NULL PRIMARY KEY, participant_type_name TEXT NOT NULL, created_at TEXT NULL DEFAULT NULL,deleted_at TEXT NULL DEFAULT NULL);';
    queryString += 'CREATE TABLE IF NOT EXISTS participants_roles(participants_id integer  null, participant_type_id INTEGER  NULL,created_at TEXT NULL DEFAULT NULL,updated_at TEXT NULL DEFAULT NULL, deleted_at TEXT NULL DEFAULT NULL,id_role INTEGER NOT NULL PRIMARY KEY);';
    queryString += 'CREATE TABLE IF NOT EXISTS updated_catalogs(catalog_name text null, timestamp text null);';
    queryString += 'CREATE TABLE IF NOT EXISTS paper_comments(id INTEGER PRIMARY KEY,paper_id INTEGER NOT NULL,title TEXT,content TEXT,deleted_at TEXT NULL);';
    db.run(queryString);
    tableList = db.exec('SELECT name FROM sqlite_master WHERE type = "table"');
    var dbToSave = toBinString(db.export());
    window.localStorage.setItem("confbox.sqlite", dbToSave);
    return tableList[0].values;
}

function listDBValues(table, columns, condition,reference) {
    var returnArr = [],
        query = '',
        result = [];
    if (columns == null) {
        query = 'SELECT * FROM ' + table;
    } else {
        var columnList = columns.join(',');
        query = 'SELECT ' + columnList + ' FROM ' + table;
    }

    if (condition != null) {
        query += ' ' + condition;
        if(reference){
            query+='\''+reference+'\'';
        }
    }
    result = db.exec(query);
    if (result.length != 0) {
        $.each(result[0].values, function(index, value) {
            returnArr[index] = [];
            for (var i = 0, len = value.length; i < len; i++) {
                if (value[i] != null && value[i] != 'null') {
                    returnArr[index][i] = decodeString(value[i]);
                }

            }
        });
    }
    return  returnArr;
}

function deleteValue(table, columns) {
    var queryString = "";
    if (columns) {
        queryString += 'DELETE ' + columns + ' FROM ' + table;
    } else {
        queryString += 'DELETE FROM ' + table;
    }
    db.exec(queryString);
    var dbToSave = toBinString(db.export());
    window.localStorage.setItem("confbox.sqlite", dbToSave);
}

function addValueToDB(table, values, columns) {
    var queryString = '',
        preparedHolder = [],
        insertFlag = [],
        preparedString = "";
    for (var i = 0, len = values.length; i < len; i++) {
        if (typeof values[i] == "string") {
            values[i] = encodeString(values[i]);
        }
    }
    if (columns) {
        queryString = 'INSERT OR IGNORE INTO ' + table + '(' + columns + ') ';
        preparedString = "'" + values.join("','") + "'";
        queryString += 'VALUES (' + preparedString + ')';
        insertFlag = db.exec(queryString);
    } else {
        queryString = 'INSERT OR IGNORE INTO ' + table + ' ';
        preparedString = "'" + values.join("','") + "'";
        queryString += 'VALUES (' + preparedString + ')';
        insertFlag = db.exec(queryString);
    }
    var dbToSave = toBinString(db.export());
    window.localStorage.setItem("confbox.sqlite", dbToSave);
    if ($.isArray(insertFlag)) {
        return true;
    } else {
        return false;
    }

}

function updateValue(table, columns, values, condition, reference) {
    var queryString = "",
        existingData = listDBValues(table, null, condition + '\'' + reference + '\'');

    if (existingData.length == 0) {
        addValueToDB(table, columns, values);
        return;
    }
    for (var i = 0, len = values.length; i < len; i++) {
        if (typeof values[i] == "string") {
            values[i] = encodeString(values[i]);
        }
    }
    if (table && values) {
        queryString += 'UPDATE ' + table + ' SET ';
        for (var i = 0, columnsLen = columns.length; i < columnsLen; i++) {
            if (i == columnsLen - 1) {
                queryString += columns[i] + '=' + "'" + values[i] + "'";
            } else {
                queryString += columns[i] + '=' + "'" + values[i] + "'" + ', ';
            }

        }
        if (condition) {
            queryString += ' ' + condition;
        }
        if (reference) {
            queryString += '\'' + reference + '\'';
        }
        db.exec(queryString);
        var dbToSave = toBinString(db.export());
        window.localStorage.setItem("confbox.sqlite", dbToSave);
    }
}
