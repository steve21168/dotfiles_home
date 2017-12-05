(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  describe("dirty work for fast package activation", function() {
    var ensureRequiredFiles, withCleanActivation;
    withCleanActivation = null;
    ensureRequiredFiles = null;
    beforeEach(function() {
      return runs(function() {
        var cleanRequireCache, getRequiredLibOrNodeModulePaths, packPath;
        packPath = atom.packages.loadPackage('vim-mode-plus').path;
        getRequiredLibOrNodeModulePaths = function() {
          return Object.keys(require.cache).filter(function(p) {
            return p.startsWith(packPath + 'lib') || p.startsWith(packPath + 'node_modules');
          });
        };
        cleanRequireCache = function() {
          var oldPaths, savedCache;
          savedCache = {};
          oldPaths = getRequiredLibOrNodeModulePaths();
          oldPaths.forEach(function(p) {
            savedCache[p] = require.cache[p];
            return delete require.cache[p];
          });
          return function() {
            oldPaths.forEach(function(p) {
              return require.cache[p] = savedCache[p];
            });
            return getRequiredLibOrNodeModulePaths().forEach(function(p) {
              if (indexOf.call(oldPaths, p) < 0) {
                return delete require.cache[p];
              }
            });
          };
        };
        withCleanActivation = function(fn) {
          var restoreRequireCache;
          restoreRequireCache = null;
          runs(function() {
            return restoreRequireCache = cleanRequireCache();
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('vim-mode-plus').then(fn);
          });
          return runs(function() {
            return restoreRequireCache();
          });
        };
        return ensureRequiredFiles = function(files) {
          var should;
          should = files.map(function(file) {
            return packPath + file;
          });
          return expect(getRequiredLibOrNodeModulePaths()).toEqual(should);
        };
      });
    });
    describe("requrie as minimum num of file as possible on startup", function() {
      var shouldRequireFilesInOrdered;
      shouldRequireFilesInOrdered = ["lib/main.js", "lib/base.coffee", "node_modules/delegato/lib/delegator.js", "node_modules/mixto/lib/mixin.js", "lib/settings.js", "lib/global-state.js", "lib/vim-state.js", "lib/mode-manager.js", "lib/command-table.coffee"];
      if (atom.inDevMode()) {
        shouldRequireFilesInOrdered.push('lib/developer.js');
      }
      it("THIS IS WORKAROUND FOR Travis-CI's", function() {
        return withCleanActivation(function() {
          return null;
        });
      });
      it("require minimum set of files", function() {
        return withCleanActivation(function() {
          return ensureRequiredFiles(shouldRequireFilesInOrdered);
        });
      });
      it("[one editor opened] require minimum set of files", function() {
        return withCleanActivation(function() {
          waitsForPromise(function() {
            return atom.workspace.open();
          });
          return runs(function() {
            var files;
            files = shouldRequireFilesInOrdered.concat('lib/status-bar-manager.js');
            return ensureRequiredFiles(files);
          });
        });
      });
      return it("[after motion executed] require minimum set of files", function() {
        return withCleanActivation(function() {
          waitsForPromise(function() {
            return atom.workspace.open().then(function(e) {
              return atom.commands.dispatch(e.element, 'vim-mode-plus:move-right');
            });
          });
          return runs(function() {
            var extraShouldRequireFilesInOrdered, files;
            extraShouldRequireFilesInOrdered = ["lib/status-bar-manager.js", "lib/operation-stack.js", "lib/selection-wrapper.js", "lib/utils.js", "node_modules/underscore-plus/lib/underscore-plus.js", "node_modules/underscore/underscore.js", "lib/blockwise-selection.js", "lib/motion.coffee", "lib/cursor-style-manager.js"];
            files = shouldRequireFilesInOrdered.concat(extraShouldRequireFilesInOrdered);
            return ensureRequiredFiles(files);
          });
        });
      });
    });
    return describe("command-table", function() {
      describe("initial classRegistry", function() {
        return it("contains one entry and it's Base class", function() {
          return withCleanActivation(function(pack) {
            var Base, classRegistry, keys;
            Base = pack.mainModule.provideVimModePlus().Base;
            classRegistry = Base.getClassRegistry();
            keys = Object.keys(classRegistry);
            expect(keys).toHaveLength(1);
            expect(keys[0]).toBe("Base");
            return expect(classRegistry[keys[0]]).toBe(Base);
          });
        });
      });
      describe("fully populated classRegistry", function() {
        return it("generateCommandTableByEagerLoad populate all registry eagerly", function() {
          return withCleanActivation(function(pack) {
            var Base, newRegistriesLength, oldRegistries, oldRegistriesLength;
            Base = pack.mainModule.provideVimModePlus().Base;
            oldRegistries = Base.getClassRegistry();
            oldRegistriesLength = Object.keys(oldRegistries).length;
            expect(Object.keys(oldRegistries)).toHaveLength(1);
            Base.generateCommandTableByEagerLoad();
            newRegistriesLength = Object.keys(Base.getClassRegistry()).length;
            return expect(newRegistriesLength).toBeGreaterThan(oldRegistriesLength);
          });
        });
      });
      return describe("make sure cmd-table is NOT out-of-date", function() {
        return it("generateCommandTableByEagerLoad return table which is equals to initially loaded command table", function() {
          return withCleanActivation(function(pack) {
            var Base, loadedCommandTable, newCommandTable, oldCommandTable, ref;
            Base = pack.mainModule.provideVimModePlus().Base;
            ref = [], oldCommandTable = ref[0], newCommandTable = ref[1];
            oldCommandTable = Base.commandTable;
            newCommandTable = Base.generateCommandTableByEagerLoad();
            loadedCommandTable = require('../lib/command-table');
            expect(oldCommandTable).not.toBe(newCommandTable);
            expect(loadedCommandTable).toEqual(oldCommandTable);
            return expect(loadedCommandTable).toEqual(newCommandTable);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL3N0ZXZlZ29vZHN0ZWluLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvc3BlYy9mYXN0LWFjdGl2YXRpb24tc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBa0JBO0FBQUEsTUFBQTs7RUFBQSxRQUFBLENBQVMsd0NBQVQsRUFBbUQsU0FBQTtBQUNqRCxRQUFBO0lBQUEsbUJBQUEsR0FBc0I7SUFDdEIsbUJBQUEsR0FBc0I7SUFFdEIsVUFBQSxDQUFXLFNBQUE7YUFDVCxJQUFBLENBQUssU0FBQTtBQUNILFlBQUE7UUFBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFkLENBQTBCLGVBQTFCLENBQTBDLENBQUM7UUFFdEQsK0JBQUEsR0FBa0MsU0FBQTtpQkFDaEMsTUFBTSxDQUFDLElBQVAsQ0FBWSxPQUFPLENBQUMsS0FBcEIsQ0FBMEIsQ0FBQyxNQUEzQixDQUFrQyxTQUFDLENBQUQ7bUJBQ2hDLENBQUMsQ0FBQyxVQUFGLENBQWEsUUFBQSxHQUFXLEtBQXhCLENBQUEsSUFBa0MsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFBLEdBQVcsY0FBeEI7VUFERixDQUFsQztRQURnQztRQUtsQyxpQkFBQSxHQUFvQixTQUFBO0FBQ2xCLGNBQUE7VUFBQSxVQUFBLEdBQWE7VUFDYixRQUFBLEdBQVcsK0JBQUEsQ0FBQTtVQUNYLFFBQVEsQ0FBQyxPQUFULENBQWlCLFNBQUMsQ0FBRDtZQUNmLFVBQVcsQ0FBQSxDQUFBLENBQVgsR0FBZ0IsT0FBTyxDQUFDLEtBQU0sQ0FBQSxDQUFBO21CQUM5QixPQUFPLE9BQU8sQ0FBQyxLQUFNLENBQUEsQ0FBQTtVQUZOLENBQWpCO0FBSUEsaUJBQU8sU0FBQTtZQUNMLFFBQVEsQ0FBQyxPQUFULENBQWlCLFNBQUMsQ0FBRDtxQkFDZixPQUFPLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBZCxHQUFtQixVQUFXLENBQUEsQ0FBQTtZ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SUFBSSxDQUFDLCtCQUFMLENBQUE7WUFDQSxtQkFBQSxHQUFzQixNQUFNLENBQUMsSUFBUCxDQUFZLElBQUksQ0FBQyxnQkFBTCxDQUFBLENBQVosQ0FBb0MsQ0FBQzttQkFDM0QsTUFBQSxDQUFPLG1CQUFQLENBQTJCLENBQUMsZUFBNUIsQ0FBNEMsbUJBQTVDO1VBUmtCLENBQXBCO1FBRGtFLENBQXBFO01BRHdDLENBQTFDO2FBWUEsUUFBQSxDQUFTLHdDQUFULEVBQW1ELFNBQUE7ZUFDakQsRUFBQSxDQUFHLGdHQUFILEVBQXFHLFNBQUE7aUJBQ25HLG1CQUFBLENBQW9CLFNBQUMsSUFBRDtBQUNsQixnQkFBQTtZQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFoQixDQUFBLENBQW9DLENBQUM7WUFDNUMsTUFBcUMsRUFBckMsRUFBQyx3QkFBRCxFQUFrQjtZQUVsQixlQUFBLEdBQWtCLElBQUksQ0FBQztZQUN2QixlQUFBLEdBQWtCLElBQUksQ0FBQywrQkFBTCxDQUFBO1lBQ2xCLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSxzQkFBUjtZQUVyQixNQUFBLENBQU8sZUFBUCxDQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUE1QixDQUFpQyxlQUFqQztZQUNBLE1BQUEsQ0FBTyxrQkFBUCxDQUEwQixDQUFDLE9BQTNCLENBQW1DLGVBQW5DO21CQUNBLE1BQUEsQ0FBTyxrQkFBUCxDQUEwQixDQUFDLE9BQTNCLENBQW1DLGVBQW5DO1VBVmtCLENBQXBCO1FBRG1HLENBQXJHO01BRGlELENBQW5EO0lBN0J3QixDQUExQjtFQXBHaUQsQ0FBbkQ7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIiMgW0RBTkdFUl1cbiMgV2hhdCBJJ20gZG9pbmcgaW4gdGhpcyB0ZXN0LXNwZWMgaXMgU1VQRVIgaGFja3ksIGFuZCBJIGRvbid0IGxpa2UgdGhpcy5cbiNcbiMgLSBXaGF0IEknbSBkb2luZyBhbmQgd2h5XG4jICAtIEludmFsaWRhdGUgcmVxdWlyZS5jYWNoZSB0byBcIm9ic2VydmUgcmVxdWlyZWQgZmlsZSBvbiBzdGFydHVwXCIuXG4jICAtIFRoZW4gcmVzdG9yZSByZXF1aXJlLmNhY2hlIHRvIG9yaWdpbmFsIHN0YXRlLlxuI1xuIyAtIEp1c3QgaW52YWxpZGF0aW5nIGlzIG5vdCBlbm91Z2ggdW5sZXNzIHJlc3RvcmVpbmcgb3RoZXIgc3BlYyBmaWxlIGZhaWwuXG4jXG4jIC0gV2hhdCBoYXBwZW5zIGp1c3QgaW52YWxpZGF0ZSByZXF1aXJlLmNhY2hlIGFuZCBOT1QgcmVzdG9yZWQgdG8gb3JpZ2luYWwgcmVxdWlyZS5jYWNoZT9cbiMgIC0gRm9yIG1vZHVsZSBzdWNoIGxpa2UgYGdsb2JsYWwtc3RhdGUuY29mZmVlYCBpdCBpbnN0YW50aWF0ZWQgYXQgcmVxdWlyZWQgdGltZS5cbiMgIC0gSW52YWxpZGF0aW5nIHJlcXVpcmUuY2FjaGUgZm9yIGBnbG9iYWwtc3RhdGUuY29mZmVlYCBtZWFucywgaXQncyByZWxvYWRlZCBhZ2Fpbi5cbiMgIC0gVGhpcyAybmQgcmVsb2FkIHJldHVybiBESUZGRVJFTlQgZ2xvYmFsU3RhdGUgaW5zdGFuY2UuXG4jICAtIFNvIGdsb2JhbFN0YXRlIGlzIG5vdyBubyBsb25nZXIgZ2xvYmFsbHkgcmVmZXJlbmNpbmcgc2FtZSBzYW1lIG9iamVjdCwgaXQncyBicm9rZW4uXG4jICAtIFRoaXMgc2l0dWF0aW9uIGlzIGNhdXNlZCBieSBleHBsaWNpdCBjYWNoZSBpbnZhbGlkYXRpb24gYW5kIG5vdCBoYXBwZW4gaW4gcmVhbCB1c2FnZS5cbiNcbiMgLSBJIGtub3cgdGhpcyBzcGVjIGlzIHN0aWxsIHN1cGVyIGhhY2t5IGFuZCBJIHdhbnQgdG8gZmluZCBzYWZlciB3YXkuXG4jICAtIEJ1dCBJIG5lZWQgdGhpcyBzcGVjIHRvIGRldGVjdCB1bndhbnRlZCBmaWxlIGlzIHJlcXVpcmVkIGF0IHN0YXJ0dXAoIHZtcCBnZXQgc2xvd2VyIHN0YXJ0dXAgKS5cbmRlc2NyaWJlIFwiZGlydHkgd29yayBmb3IgZmFzdCBwYWNrYWdlIGFjdGl2YXRpb25cIiwgLT5cbiAgd2l0aENsZWFuQWN0aXZhdGlvbiA9IG51bGxcbiAgZW5zdXJlUmVxdWlyZWRGaWxlcyA9IG51bGxcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgcnVucyAtPlxuICAgICAgcGFja1BhdGggPSBhdG9tLnBhY2thZ2VzLmxvYWRQYWNrYWdlKCd2aW0tbW9kZS1wbHVzJykucGF0aFxuXG4gICAgICBnZXRSZXF1aXJlZExpYk9yTm9kZU1vZHVsZVBhdGhzID0gLT5cbiAgICAgICAgT2JqZWN0LmtleXMocmVxdWlyZS5jYWNoZSkuZmlsdGVyIChwKSAtPlxuICAgICAgICAgIHAuc3RhcnRzV2l0aChwYWNrUGF0aCArICdsaWInKSBvciBwLnN0YXJ0c1dpdGgocGFja1BhdGggKyAnbm9kZV9tb2R1bGVzJylcblxuICAgICAgIyBSZXR1cm4gZnVuY3Rpb24gdG8gcmVzdG9yZSBvcmlnaW5hbCByZXF1aXJlLmNhY2hlIG9mIGludGVyZXN0XG4gICAgICBjbGVhblJlcXVpcmVDYWNoZSA9IC0+XG4gICAgICAgIHNhdmVkQ2FjaGUgPSB7fVxuICAgICAgICBvbGRQYXRocyA9IGdldFJlcXVpcmVkTGliT3JOb2RlTW9kdWxlUGF0aHMoKVxuICAgICAgICBvbGRQYXRocy5mb3JFYWNoIChwKSAtPlxuICAgICAgICAgIHNhdmVkQ2FjaGVbcF0gPSByZXF1aXJlLmNhY2hlW3BdXG4gICAgICAgICAgZGVsZXRlIHJlcXVpcmUuY2FjaGVbcF1cblxuICAgICAgICByZXR1cm4gLT5cbiAgICAgICAgICBvbGRQYXRocy5mb3JFYWNoIChwKSAtPlxuICAgICAgICAgICAgcmVxdWlyZS5jYWNoZVtwXSA9IHNhdmVkQ2FjaGVbcF1cbiAgICAgICAgICBnZXRSZXF1aXJlZExpYk9yTm9kZU1vZHVsZVBhdGhzKCkuZm9yRWFjaCAocCkgLT5cbiAgICAgICAgICAgIGlmIHAgbm90IGluIG9sZFBhdGhzXG4gICAgICAgICAgICAgIGRlbGV0ZSByZXF1aXJlLmNhY2hlW3BdXG5cbiAgICAgIHdpdGhDbGVhbkFjdGl2YXRpb24gPSAoZm4pIC0+XG4gICAgICAgIHJlc3RvcmVSZXF1aXJlQ2FjaGUgPSBudWxsXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICByZXN0b3JlUmVxdWlyZUNhY2hlID0gY2xlYW5SZXF1aXJlQ2FjaGUoKVxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgndmltLW1vZGUtcGx1cycpLnRoZW4oZm4pXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICByZXN0b3JlUmVxdWlyZUNhY2hlKClcblxuICAgICAgZW5zdXJlUmVxdWlyZWRGaWxlcyA9IChmaWxlcykgLT5cbiAgICAgICAgc2hvdWxkID0gZmlsZXMubWFwKChmaWxlKSAtPiBwYWNrUGF0aCArIGZpbGUpXG4gICAgICAgICMgY29uc29sZS5sb2cgXCIjIHNob3VsZFwiLCBzaG91bGQuam9pbihcIlxcblwiKVxuICAgICAgICAjIGNvbnNvbGUubG9nIFwiIyBhY3R1YWxcIiwgZ2V0UmVxdWlyZWRMaWJPck5vZGVNb2R1bGVQYXRocygpLmpvaW4oXCJcXG5cIilcbiAgICAgICAgZXhwZWN0KGdldFJlcXVpcmVkTGliT3JOb2RlTW9kdWxlUGF0aHMoKSkudG9FcXVhbChzaG91bGQpXG5cbiAgIyAqIFRvIHJlZHVjZSBJTyBhbmQgY29tcGlsZS1ldmFsdWF0aW9uIG9mIGpzIGZpbGUgb24gc3RhcnR1cFxuICBkZXNjcmliZSBcInJlcXVyaWUgYXMgbWluaW11bSBudW0gb2YgZmlsZSBhcyBwb3NzaWJsZSBvbiBzdGFydHVwXCIsIC0+XG4gICAgc2hvdWxkUmVxdWlyZUZpbGVzSW5PcmRlcmVkID0gW1xuICAgICAgXCJsaWIvbWFpbi5qc1wiXG4gICAgICBcImxpYi9iYXNlLmNvZmZlZVwiXG4gICAgICBcIm5vZGVfbW9kdWxlcy9kZWxlZ2F0by9saWIvZGVsZWdhdG9yLmpzXCJcbiAgICAgIFwibm9kZV9tb2R1bGVzL21peHRvL2xpYi9taXhpbi5qc1wiXG4gICAgICBcImxpYi9zZXR0aW5ncy5qc1wiXG4gICAgICBcImxpYi9nbG9iYWwtc3RhdGUuanNcIlxuICAgICAgXCJsaWIvdmltLXN0YXRlLmpzXCJcbiAgICAgIFwibGliL21vZGUtbWFuYWdlci5qc1wiXG4gICAgICBcImxpYi9jb21tYW5kLXRhYmxlLmNvZmZlZVwiXG4gICAgXVxuICAgIGlmIGF0b20uaW5EZXZNb2RlKClcbiAgICAgIHNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZC5wdXNoKCdsaWIvZGV2ZWxvcGVyLmpzJylcblxuICAgIGl0IFwiVEhJUyBJUyBXT1JLQVJPVU5EIEZPUiBUcmF2aXMtQ0knc1wiLCAtPlxuICAgICAgIyBIQUNLOlxuICAgICAgIyBBZnRlciB2ZXJ5IGZpcnN0IGNhbGwgb2YgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ3ZpbS1tb2RlLXBsdXMnKVxuICAgICAgIyByZXF1aXJlLmNhY2hlIGlzIE5PVCBwb3B1bGF0ZWQgeWV0IG9uIFRyYXZpcy1DSS5cbiAgICAgICMgSXQgZG9lc24ndCBpbmNsdWRlIGxpYi9tYWluLmNvZmZlZSggdGhpcyBpcyBvZGQgc3RhdGUhICkuXG4gICAgICAjIFRoaXMgb25seSBoYXBwZW5zIGluIHZlcnkgZmlyc3QgYWN0aXZhdGlvbi5cbiAgICAgICMgU28gcHV0aW5nIGhlcmUgdXNlbGVzcyB0ZXN0IGp1c3QgYWN0aXZhdGUgcGFja2FnZSBjYW4gYmUgd29ya2Fyb3VuZC5cbiAgICAgIHdpdGhDbGVhbkFjdGl2YXRpb24gLT5cbiAgICAgICAgbnVsbFxuXG4gICAgaXQgXCJyZXF1aXJlIG1pbmltdW0gc2V0IG9mIGZpbGVzXCIsIC0+XG4gICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uIC0+XG4gICAgICAgIGVuc3VyZVJlcXVpcmVkRmlsZXMoc2hvdWxkUmVxdWlyZUZpbGVzSW5PcmRlcmVkKVxuXG4gICAgaXQgXCJbb25lIGVkaXRvciBvcGVuZWRdIHJlcXVpcmUgbWluaW11bSBzZXQgb2YgZmlsZXNcIiwgLT5cbiAgICAgIHdpdGhDbGVhbkFjdGl2YXRpb24gLT5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbigpXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBmaWxlcyA9IHNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZC5jb25jYXQoJ2xpYi9zdGF0dXMtYmFyLW1hbmFnZXIuanMnKVxuICAgICAgICAgIGVuc3VyZVJlcXVpcmVkRmlsZXMoZmlsZXMpXG5cbiAgICBpdCBcIlthZnRlciBtb3Rpb24gZXhlY3V0ZWRdIHJlcXVpcmUgbWluaW11bSBzZXQgb2YgZmlsZXNcIiwgLT5cbiAgICAgIHdpdGhDbGVhbkFjdGl2YXRpb24gLT5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbigpLnRoZW4gKGUpIC0+XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGUuZWxlbWVudCwgJ3ZpbS1tb2RlLXBsdXM6bW92ZS1yaWdodCcpXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHRyYVNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZCA9IFtcbiAgICAgICAgICAgIFwibGliL3N0YXR1cy1iYXItbWFuYWdlci5qc1wiXG4gICAgICAgICAgICBcImxpYi9vcGVyYXRpb24tc3RhY2suanNcIlxuICAgICAgICAgICAgXCJsaWIvc2VsZWN0aW9uLXdyYXBwZXIuanNcIlxuICAgICAgICAgICAgXCJsaWIvdXRpbHMuanNcIlxuICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvdW5kZXJzY29yZS1wbHVzL2xpYi91bmRlcnNjb3JlLXBsdXMuanNcIlxuICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvdW5kZXJzY29yZS91bmRlcnNjb3JlLmpzXCJcbiAgICAgICAgICAgIFwibGliL2Jsb2Nrd2lzZS1zZWxlY3Rpb24uanNcIlxuICAgICAgICAgICAgXCJsaWIvbW90aW9uLmNvZmZlZVwiXG4gICAgICAgICAgICBcImxpYi9jdXJzb3Itc3R5bGUtbWFuYWdlci5qc1wiXG4gICAgICAgICAgXVxuICAgICAgICAgIGZpbGVzID0gc2hvdWxkUmVxdWlyZUZpbGVzSW5PcmRlcmVkLmNvbmNhdChleHRyYVNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZClcbiAgICAgICAgICBlbnN1cmVSZXF1aXJlZEZpbGVzKGZpbGVzKVxuXG4gIGRlc2NyaWJlIFwiY29tbWFuZC10YWJsZVwiLCAtPlxuICAgICMgKiBMb2FkaW5nIGF0b20gY29tbWFuZHMgZnJvbSBwcmUtZ2VuZXJhdGVkIGNvbW1hbmQtdGFibGUuXG4gICAgIyAqIFdoeT9cbiAgICAjICB2bXAgYWRkcyBhYm91dCAzMDAgY21kcywgd2hpY2ggaXMgaHVnZSwgZHluYW1pY2FsbHkgY2FsY3VsYXRpbmcgYW5kIHJlZ2lzdGVyIGNtZHNcbiAgICAjICB0b29rIHZlcnkgbG9uZyB0aW1lLlxuICAgICMgIFNvIGNhbGNsdWF0ZSBub24tZHluYW1pYyBwYXIgdGhlbiBzYXZlIHRvIGNvbW1hbmQtdGFibGUuY29mZmUgYW5kIGxvYWQgaW4gb24gc3RhcnR1cC5cbiAgICAjICBXaGVuIGNvbW1hbmQgYXJlIGV4ZWN1dGVkLCBuZWNlc3NhcnkgY29tbWFuZCBjbGFzcyBmaWxlIGlzIGxhenktcmVxdWlyZWQuXG4gICAgZGVzY3JpYmUgXCJpbml0aWFsIGNsYXNzUmVnaXN0cnlcIiwgLT5cbiAgICAgIGl0IFwiY29udGFpbnMgb25lIGVudHJ5IGFuZCBpdCdzIEJhc2UgY2xhc3NcIiwgLT5cbiAgICAgICAgd2l0aENsZWFuQWN0aXZhdGlvbiAocGFjaykgLT5cbiAgICAgICAgICBCYXNlID0gcGFjay5tYWluTW9kdWxlLnByb3ZpZGVWaW1Nb2RlUGx1cygpLkJhc2VcbiAgICAgICAgICBjbGFzc1JlZ2lzdHJ5ID0gQmFzZS5nZXRDbGFzc1JlZ2lzdHJ5KClcbiAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoY2xhc3NSZWdpc3RyeSlcbiAgICAgICAgICBleHBlY3Qoa2V5cykudG9IYXZlTGVuZ3RoKDEpXG4gICAgICAgICAgZXhwZWN0KGtleXNbMF0pLnRvQmUoXCJCYXNlXCIpXG4gICAgICAgICAgZXhwZWN0KGNsYXNzUmVnaXN0cnlba2V5c1swXV0pLnRvQmUoQmFzZSlcblxuICAgIGRlc2NyaWJlIFwiZnVsbHkgcG9wdWxhdGVkIGNsYXNzUmVnaXN0cnlcIiwgLT5cbiAgICAgIGl0IFwiZ2VuZXJhdGVDb21tYW5kVGFibGVCeUVhZ2VyTG9hZCBwb3B1bGF0ZSBhbGwgcmVnaXN0cnkgZWFnZXJseVwiLCAtPlxuICAgICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uIChwYWNrKSAtPlxuICAgICAgICAgIEJhc2UgPSBwYWNrLm1haW5Nb2R1bGUucHJvdmlkZVZpbU1vZGVQbHVzKCkuQmFzZVxuICAgICAgICAgIG9sZFJlZ2lzdHJpZXMgPSBCYXNlLmdldENsYXNzUmVnaXN0cnkoKVxuICAgICAgICAgIG9sZFJlZ2lzdHJpZXNMZW5ndGggPSBPYmplY3Qua2V5cyhvbGRSZWdpc3RyaWVzKS5sZW5ndGhcbiAgICAgICAgICBleHBlY3QoT2JqZWN0LmtleXMob2xkUmVnaXN0cmllcykpLnRvSGF2ZUxlbmd0aCgxKVxuXG4gICAgICAgICAgQmFzZS5nZW5lcmF0ZUNvbW1hbmRUYWJsZUJ5RWFnZXJMb2FkKClcbiAgICAgICAgICBuZXdSZWdpc3RyaWVzTGVuZ3RoID0gT2JqZWN0LmtleXMoQmFzZS5nZXRDbGFzc1JlZ2lzdHJ5KCkpLmxlbmd0aFxuICAgICAgICAgIGV4cGVjdChuZXdSZWdpc3RyaWVzTGVuZ3RoKS50b0JlR3JlYXRlclRoYW4ob2xkUmVnaXN0cmllc0xlbmd0aClcblxuICAgIGRlc2NyaWJlIFwibWFrZSBzdXJlIGNtZC10YWJsZSBpcyBOT1Qgb3V0LW9mLWRhdGVcIiwgLT5cbiAgICAgIGl0IFwiZ2VuZXJhdGVDb21tYW5kVGFibGVCeUVhZ2VyTG9hZCByZXR1cm4gdGFibGUgd2hpY2ggaXMgZXF1YWxzIHRvIGluaXRpYWxseSBsb2FkZWQgY29tbWFuZCB0YWJsZVwiLCAtPlxuICAgICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uIChwYWNrKSAtPlxuICAgICAgICAgIEJhc2UgPSBwYWNrLm1haW5Nb2R1bGUucHJvdmlkZVZpbU1vZGVQbHVzKCkuQmFzZVxuICAgICAgICAgIFtvbGRDb21tYW5kVGFibGUsIG5ld0NvbW1hbmRUYWJsZV0gPSBbXVxuXG4gICAgICAgICAgb2xkQ29tbWFuZFRhYmxlID0gQmFzZS5jb21tYW5kVGFibGVcbiAgICAgICAgICBuZXdDb21tYW5kVGFibGUgPSBCYXNlLmdlbmVyYXRlQ29tbWFuZFRhYmxlQnlFYWdlckxvYWQoKVxuICAgICAgICAgIGxvYWRlZENvbW1hbmRUYWJsZSA9IHJlcXVpcmUoJy4uL2xpYi9jb21tYW5kLXRhYmxlJylcblxuICAgICAgICAgIGV4cGVjdChvbGRDb21tYW5kVGFibGUpLm5vdC50b0JlKG5ld0NvbW1hbmRUYWJsZSlcbiAgICAgICAgICBleHBlY3QobG9hZGVkQ29tbWFuZFRhYmxlKS50b0VxdWFsKG9sZENvbW1hbmRUYWJsZSlcbiAgICAgICAgICBleHBlY3QobG9hZGVkQ29tbWFuZFRhYmxlKS50b0VxdWFsKG5ld0NvbW1hbmRUYWJsZSlcbiJdfQ==
